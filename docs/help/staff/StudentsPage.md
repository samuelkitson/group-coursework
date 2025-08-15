# Students page

The students page is used to manage the list of students enrolled on an
assignment. It's available to the module staff.

## Adding students

This is where you can upload a list of students to be added to an assignment.
You'll need to upload CSVs with the following columns:

* `email`: the student's email address. Where students have email address
aliases, you need to use their User Principal Name.
* `name`: the student's name, e.g. "Bob Smith". This acts as a placeholder until
they first log in with Microsoft and their profile can be synced.

If it's easier, you can upload multiple CSVs one at a time. Any duplicates will
be ignored.

### After teams have been allocated

Sometimes you may need to add extra students after you've already allocated
teams. Simply upload a CSV containing the new students and then choose an option
in the popup:

* **Distribute among existing teams**: spread the new students out between the
existing teams, filling up the smallest groups first. Useful for replacing
students who were removed from teams.
* **Add to a single new team**: add all of the new students to a single new
team. This is useful if you want to manually move them around.

## Setting pairing exclusions

If there are students who must not be placed into a team together, you can
configure this from the students page. Find one of the students in the list and
click the person icon with the cross. In the popup, select all of the students
to avoid teaming them up with and click confirm. You can use the same method to
remove previously set exclusions.

In the list, any students with pairing exclusions set will appear with a yellow
icon. The allocation algorithm will avoid putting these students in the same
team wherever possible and will alert you if it's unavoidable. Note that setting
pairing exclusions after allocating teams has no effect.

## Removing students

If you uploaded the wrong CSV, you can just remove all the students by clicking
the red button under "Start again". To remove a single student, click the red X
icon by their name.

If you remove a student after you've allocated teams, they'll be removed and
won't automatically be replaced.
