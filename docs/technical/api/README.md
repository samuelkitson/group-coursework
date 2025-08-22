# API documentation

> [!IMPORTANT]
> This technical guide is intended for developers.

These guides outline the various API endpoints within the app. ExpressJS is used
to power the API and it connects to a MongoDB database using Mongoose.

The API endpoints are accessible under /api and are grouped into various
controllers. Each file in this collection is for a specific controller and group
of endpoints.

Endpoints may accept parameters through path parameters, the query string or the
form body. Where path parameters are used, these will be shown with a colon in
these guides. For example, `/api/assignment/:assignment` means that the
`:assignment` part should be replaced with the ObjectId of an assignment.

## Authentication and access control

Cookies are used to maintain sessions. Session objects are stored in MongoDB to
maintain persistence in case the server restarts, and they contain a reference
to the user's ID.

API endpoints are secured in a few different ways. Firstly, any endpoints that
must only be accessible to logged-in users are protected behind a
`requireLoggedIn` middleware. For any sessions where the user has not logged in,
this will cause a `SessionInvalidError`.

`requireLoggedIn` also accepts a `permittedRole` argument. If provided, the user
will also be denied access if the role in their session object does not match.
A specific exception is in place that allows administrator users to access
endpoints for `staff`.

Some endpoints additionally check whether the user is permitted to access a
specific database resource. These checks are facilitated by
`checkAssignmentRole` and `checkTeamRole`. They verify whether the provided
assignment or team ID is valid and then check whether the user is a student,
lecturer or supervisor on the assignment or a member, supervisor or lecturer of
the team.

> [!NOTE]
> This is a key place for further development and optimisation. Every time that
> checkAssignment/TeamRole is called, one or more database queries are made.
> Often the same queries are made later in the endpoint handler too.
