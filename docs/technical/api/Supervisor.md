# Supervisor endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/supervisor`.

## GET /api/supervisor

Retrieves the list of supervisors registered on the specified assignment.

* **Handler**: `supervisorController.getSupervisors`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response object**:
  * `supervisors`: list of the supervisors and their details

## POST /api/supervisor

Adds a single supervisor to the specified assignment.

* **Handler**: `supervisorController.addSupervisor`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `supervisor` (body): the email address of the supervisor to add

## POST /api/supervisor/bulk

Accepts a list of supervisor email addresses to be added to the specified
assignment.

* **Handler**: `supervisorController.bulkAddSupervisors`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `supervisors` (body): list of email addresses to be added as supervisors

## PATCH /api/supervisor/:supervisor

Adjusts the list of teams that a supervisor is assigned to within an assignment.

* **Handler**: `supervisorController.changeSupervisorTeams`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `supervisor` (path): the ObjectId of the supervisor
  * `assignment` (body): the ObjectId of the assignment
  * `teams` (body): list of ObjectIds of teams for them to be assigned to

## DELETE /api/supervisor/:supervisor

Removes a supervisor from an assignment, and deallcoates them from all of their
teams.

* **Handler**: `supervisorController.removeSupervisor`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `supervisor` (path): the ObjectId of the supervisor
  * `assignment` (body): the ObjectId of the assignment

## POST /api/supervisor/allocate

Automatically allocates supervisors to teams without any supervisors currently
assigned. Attempts to do this as evenly as possible so that each supervisor is
supervising approximately the same number of teams.

* **Handler**: `supervisorController.autoAllocateSupervisors`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
