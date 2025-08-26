# Team endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/team`.

## GET /api/team/all

Retrieves details about all of the teams on the specified assignment. In the
default mode, this will also fetch additional data about teams (including
member details, attendance records, insights about teams and students and
statistics about disputes, meetings and check-ins). Simple mode can be enabled
to return just team ObjectIds and numbers. Supervisors will only be shown the
teams that they supervisor. Teams with no students will be ignored.

* **Handler**: `teamController.getAllForAssignment`
* **Access control**: supervisor or lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
  * `mode` (query): set to `simple` to enable simple mode
* **Response object**:
  * `teams`: list of details about the teams

## GET /api/team/csv

Downloads a CSV list of student email addresses and their teams numbers. This is
intended for import into another system.

* **Handler**: `teamController.downloadTeamsCsv`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response**: CSV as an attachment

## GET /api/team/mine

Fetches details about the student's own teams. This will include details about
the other team members: bios, meeting preferences and best rated skills. By
default this fetches details of all of their teams, but an assignment ObjectId
can be provided to filter the list.

* **Handler**: `teamController.getMyTeam`
* **Access control**: student
* **Parameters**:
  * `assignment` (query): optionally, the ObjectId of an assignment
* **Response object**:
  * `teams`: list of the student's teams and their details

## POST /api/team/new

Creates a new empty team on an assignment and moves the specified student onto
it.

* **Handler**: `teamController.newTeam`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `student` (body): the ObjectId of the student
* **Response object**:
  * `team`: details of the new team

## POST /api/team/:team/new-member

Moves a student to a different team within an assignment. They will be
automatically unassigned from their previous team.

* **Handler**: `teamController.addMember`
* **Access control**: lecturer of specified team
* **Parameters**:
  * `team` (path): the ObjectId of the new team
  * `student` (body): the ObjectId of the student
