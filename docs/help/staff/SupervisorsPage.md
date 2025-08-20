# Supervisors page

The supevisors page is used to manage the team supervisors on an assignment.
This is an optional feature; if you don't need supervisors, just ignore this
page and the feature will remain disabled.

## Adding supervisors

Supervisors are added using their email addresses. You can either add them
individually or in bulk by uploading a text file. You won't be able to add
anyone who's already a lecturer or student on the module.

If you're uploading a text file, make sure that you provide a supervisor email
address on each line. This isn't a CSV formatted file and it doesn't need any
headers. An example is:
```
user1@example.org
user2@example.org
user3@example.org
```

Supervisors will receive an automated email as soon as they're added to an
assignment.

> [!NOTE]
> If you add a supervisor who hasn't logged in before, a placeholder account
> will be created for them. Their display name will show up as their email
> address until they first log in. Please encourage supervisors to log in as
> soon as possible.

## Searching for supervisors

Just like on the student page, you can use the search bar at the top of the
list to find specific supervisors. You can search either by their name or email
address.

## Allocating supervisors to teams

Once you've allocated teams and released them to students, you can assign
supervisors to each team.

The system can do this for you automatically when you click the green "Assign
supervisors" button. They'll be assigned evenly to any teams without a
supervisor already. Teams will have a single supervisor.

You can also manually assign or adjust supervisor allocations. This can be done
by finding a supervisor in the list and choosing the "Edit teams" option by
their name. In the popup, choose the teams they should supervise and then save
your changes.

> [!TIP]
> Teams can have any number of supervisors. If a team's main supervisor is off
> sick, you can temporarily assign a second supervisor to their team. They'll
> have exactly the same permissions and can be removed again at any point.

## Removing supervisors

If you need to remove a supervisor, find them in the list and click the "Remove
supervisor" button by their name. They'll be removed from any teams they
supervisor and won't be replaced.

To assign other supervisors to fill the gaps they left, simply click the "Assign
supervisors" button.
