# Group Coursework App
This is the code repository for the web app used to help support and manage
group coursework assignments at university. It also contains extensive help
guides and documentation for users and developers.

> [!NOTE]
> This software is provided "as is", without warranty of any kind. There is no
> guarantee of future support or development work. Commercial re-use is not 
> permitted. You must provide a link to the original code repository in any
> derivative work.

## Background
This was originally a Computer Science final year undergraduate project by Sam
Kitson at the University of Southampton. It was later extended during a summer
internship within ECS for use in undergraduate teaching.

A paper covering the research, design, development and evaluation of the project
was published in January 2026. This paper is available for free via Open Access,
and can be found in the [ACM Digital Library](https://doi.org/10.1145/3772338.3772348).
A PDF version is available from the University of Southampton website [here](https://eprints.soton.ac.uk/507283/1/cep2026_10.pdf).

## Feature overview

It has a number of key features that aim to improve the group coursework
experience for staff, supervisors and students:

* **Automated team allocation** using a genetic algorithm approach and data from
a variety of sources.
* **Skills self-assessment** for students to help staff identify class-wide
strengths and weaknesses, create teams balanced in skillsets and help teams
allocate work more effectively.
* **Meeting tracking tools** that teach students best practice for recording
accurate and helpful meeting minutes and ensure that all team members are kept
up-to-date, no matter their meeting attendance.
* **Regular check-ins** that provide longitudinal data about perceived workload
balance within teams.
* **Longer peer reviews** that give students a chance to rate each other's work
and provide constructive review comments.
* **Automated insights** for staff that identify teams and students who may be
struggling to help provide targetted support early on.
* **Supervisor tools** that allow older students or staff to monitor and guide a
small number of teams, while making private observations about their progress to
help inform marking decisions.
* **De-escalation features** such as the ability to dispute meeting minutes, to
mitigate the risk of group arguments and resolve potential issues before they
arise.
* **Detailed progress reports** that aggregate data about teams and individuals
to help staff decide marks fairly.

## Development and running locally

Docker Compose can be used to easily run a local instance of this app. Please
see the guides at [docs/technical](./docs/technical/LocalDevelopment.md) for
more information.

## Found a bug?

Please report it! Head to the Issues tab above and describe what you were doing,
what you expected to happen and what happened instead. If you're able to, please
narrow down the source of the bug within the code.
