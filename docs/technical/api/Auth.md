# Auth endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/auth`.

## Authentication overview

There are two main login methods supported by the app. Primarily users will log
in using OpenID Connect via Microsoft. Some user accounts may also be configured
to use password-based login by setting a `passwordHash` on their MongoDB
document.

## POST /api/auth/login

Basic username/password login for users who have a `passwordHash` added to their
account.

* **Handler**: `authController.login`
* **Access control**: none
* **Parameters**:
  * `email` (body): the user's email address (likely their UPN)
  * `password` (body): the user's password
* **Response object**:
  * `userId`: the user's ObjectId
  * `email`: the user's email address
  * `displayName`: the user's display name
  * `role`: the user's role
  * `canCreateAssignments`: true if the user is permitted to create assignments

## GET /api/auth/refresh

Refreshes the account data of the current logged-in user. This can be useful for
updating data such as a user's role or display name, without restarting the
session.

* **Handler**: `authController.refreshUserData`
* **Access control**: logged in
* **Response object**:
  * `userId`: the user's ObjectId
  * `email`: the user's email address
  * `displayName`: the user's display name
  * `role`: the user's role
  * `canCreateAssignments`: true if the user is permitted to create assignments

## POST /api/auth/logout

Ends the current session and invalidates the session token.

* **Handler**: `authController.logout`
* **Access control**: logged in

## GET /api/auth/azure-login

Starts the "Login with Microsoft" flow by generating an authorization URL to
redirect the user to. This includes a random state parameter which is stored in
the user's current session.

* **Handler**: `authController.getAzureLoginLink`
* **Access control**: none

## POST /api/auth/azure-callback

Completes the "Login with Microsoft" flow by processing the authorization code
returned from Microsoft. Note that this isn't the actual redirect URL, which is
instead /login-callback. This is so that the frontend React app receives the
code, displays any errors and then makes the POST request to this endpoint.

* **Handler**: `authController.azureLoginCallback`
* **Access control**: none, but state token must be valid
* **Parameters**:
  * `code` (body): the authorization code from Microsoft
  * `state` (body): the state token
* **Response object**:
  * `userId`: the user's ObjectId
  * `email`: the user's email address
  * `displayName`: the user's display name
  * `role`: the user's role
  * `canCreateAssignments`: true if the user is permitted to create assignments

## GET /api/auth/search

Searches for users by their email address or display name. Only complete matches
are accepted.

* **Handler**: `authController.searchForUser`
* **Access control**: staff
* **Parameters**:
  * `string` (body): the search string
* **Response object**:
  * `users`: any matching users
