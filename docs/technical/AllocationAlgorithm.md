# Allocation algorithm

This file documents how the allocation algorithm works and is adapted from the
dissertation report upon which this project is based. This is fairly technical
and is intended for people maintaining, fixing or extending the codebase.

## High-level design

When the project was originally started, the algorithm design was based upon
both existing research and primary research carried out to elicit user
requirements. An evolutionary algorithm is used, where a chromosome represents
a potential allocation of students to groups. In code this is implemented as a
2D array of student IDs; for example, `[[1,2,3], [4,5,6]]` means that students
1, 2 and 3 are in group 1. Note that the student IDs are actually MongoDB user
ObjectIds. An overview of how the algorithm works is detailed below:

1. **Generate an initial population.** In practice, this involves randomly
shuffling the list of students IDs and splitting them into groups. Where the
cohort doesn't divide evenly, groups of size one larger or smaller are created.
2. **Evaluate group and allocation fitnesses.** Each group in each allocation
is evaluated against the user-configured allocation preferences. This step is
explained further later. Once each group's fitness is calculated, they are
aggregated to produce an overall fitness for each allocation in the population.
3. **Copy the best allocations (elitism).** A given top % of the allocations (by
fitness score) are copied and stored. They will not be edited this round which
ensures that the best allocations aren't accidentally lost through mutations.
4. **Discard the worst allocations (selection).** A larger top % of the
allocations are retained within the populations and all others discarded. Note
that this also includes the elite allocations.
5. **Combine the best groups from pairs of allocation (crossover).** This is the
evolutionary step that aims to take the best groups from a randomly selected
pair of parent allocations (repeated a number of times with different pairs).
The groups from both allocations are combined into a single list in descending
order of fitness. The code then iterates through this list to create a list of
child groups; when the next group doesn't contain any students already in child
groups, it's added to the child list. If the group contains a student who
already appears in a child group, all of the students in that group are held
aside. Once all groups from both parents have been checked like this, any of
these "leftover" students are randomly allocated to new groups or fill gaps in
other child groups.
6. **Randomly swap students between groups (mutation).** This step randomly
selects allocations from the population and then randomly swaps students between
groups within it.
7. **Add elite allocations back in.** The previously copied elite allocations
are returned to the population.
8. **Remove any duplicate allocations.** The algorithm has a tendency to
generate identical allocations, especially later on during execution when the
solutions begin to converge. This step simply removes any duplicates (ignoring
the ordering of members within groups, and groups themselves) using a custom
hashing function for speed.

## Fitness function

The design of the fitness function was based on primary research carried out on
both students and lecturers, with the user interface designed to reflect the
existing ways that lecturers allocate groups. The overall idea is that lecturers
define their ideal groups using "criteria blocks" and specify any specific
group characteristics to avoid generating using "deal-breaker blocks". As a
basic example, a lecturer might choose criteria to create groups with a good mix
of marks and skills but specifically avoid creating groups with lone female/NB
students.

In the UI, the lecturer configures their desired criteria and ranks them in
order of importance. They also configure any deal-breakers and assign an
important score to each (rather than ranking them).

To calculate the fitness of a group within an allocation, the algorithm computes
computes a score for each criterion in the range 0.0-1.0, with 1.0 meaning that
the group is a perfect match for the criterion. These are then combined with a
weighted average according to the lecturer's ranking. For example if they
define 3 criteria, the first is weighted 3, the second 2 and the last 1.

Next, the algorithm checks whether the group violates any of the deal-breakers.
These are binary and if triggered, a proportional penalty is applied to the
group's fitness score. The size of the penalty varies based on the
user-configured "importance" score. Deal-breakers can stack and are applied
consecutively if multiple are triggered for a group. There are some additional
deal-breakers that are not directly configured by the user, such as one for
any small groups that have to be generated because the cohort won't divide
evenly; these are applied in the same way.

This binary approach to deal-breakers makes it easier for the mutation step of
the algorithm to swap two students and untrigger a deal-breaker, as this will be
rewarded by suddenly removing a large penalty on the fitness score. For example
two groups with one female student each may receive a large deal-breaker
penalty. If the mutation step randomly swaps students in such a way that they're
moved to be together in one team, suddenly neither deal-breaker applies and both
group fitnesses increase significantly to reward the algorithm.

An overall allocation fitness is calculated by aggregating the fitnesses of its
constituent groups. There are two main approaches to this: using the lowest
group fitness or taking a mean average. Testing suggests that using the minimum
encourages the algorithm to always improve the "worst" group, and that using the
average can lead to a wide range of group fitnesses within an allocation. For
that reason, minimum mode is currently configured.

## Criteria and deal-breakers

This section explores in more depth the specific criteria and deal-breakers
built into the system. A number of common pre-defined options are made available
to lecturers along with custom options that allow them to extend the
functionality with data uploaded from a CSV. It is therefore not anticipated
that any further pre-defined criteria or deal-breakers will need to be added,
but nonetheless the process for this is outlined below.

### Adding new pre-defined options

As described above, if lecturers wish to configure allocation to use data
outside the pre-defined options, it's recommended that they use the custom
options already in the system. If more complicated criteria or deal-breakers are
required however, they can be programmed into the system. Take care with this as
it is easy to accidentally break the algorithm code. The rough steps you will
need to follow are outlined below:

1. Add the new option to `allocationOptions.js` under the relevant section,
following the format of the existing options. Provide a `name`, `description`
and `category` at a minimum. If you expect the user to upload the data required
for this option, set the column name as an `attribute`. The `options` field
determines which form fields will be shown to the user on the control page.

2. Step 1 should make the option appear in the pop-up on the allocation controls
page. If the icon doesn't render, make sure the category you have set is one of
the existing options. Use category `data` if in doubt.

3. Add any custom fitness function or deal-breaker code to `algorithm.js`.
Use the existing code as a guide.
   - For a new criterion, add any new code to `groupCriterionFitness`. Identify
   the criterion by its name as configured in Step 1 using `criterion["name"]`
   and be sure to return a value between 0 and 1, with 1 being best. If there
   is any invalid data, throw an `AllocationError`.
   - For a new deal-breaker, add any new code to `checkGroupPenalty`. Identify
   the deal-breaker by its name and return `true` if the deal-breaker is
   triggered (and the penalty should apply) or `false` otherwise.
