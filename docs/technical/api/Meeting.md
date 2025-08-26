# Meeting endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/meeting`.

## GET /api/meeting

Retrieves the meeting minutes history for the specified team.

* **Handler**: `meetingController.getMeetingsForTeam`
* **Access control**: member, supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
* **Response object**:
  * `meetings`: list of historic meeting minutes
  * `attendanceStats`: meeting attendance statistics for the team members and,
  if applicable, their supervisors

## POST /api/meeting

Records a new meeting and add its minutes, actions and attendance records to the
list for the team.

* **Handler**: `meetingController.recordNewMeeting`
* **Access control**: student member of specified team
* **Parameters**:
  * `team` (body): the ObjectId of the team
  * `attendance` (body): the meeting attendance log
  * `dateTime` (body): the UTC date and time of the meeting (ISO 8601 formatted)
  * `discussion` (body): the meeting minutes and discussion notes
  * `location` (body): the meeting location
  * `newActions` (body): details of any newly agreed actions and their assignees
  * `previousActions` (body): details of previously agreed actions and whether
  they were completed

## DELETE /api/meeting/:meeting

Deletes a meeting from a team's meeting history. The student who recorded the
meeting can delete it up to an hour after it was recorded, otherwise only a
supervisor or lecturer can delete it.

* **Handler**: `meetingController.deleteMeeting`
* **Access control**: member, supervisor or lecturer of specified team
* **Parameters**:
  * `meeting` (path): the ObjectId of the meeting

## PUT /api/meeting/:meeting

Update a meeting's record. The student who recorded the meeting can edit i up to
an hour after it was recorded, otherwise only a supervisor or lecturer can make
edits.

* **Handler**: `meetingController.update`
* **Access control**: member, supervisor or lecturer of specified team
* **Parameters**:
  * `meeting` (path): the ObjectId of the meeting
  * `attendance` (body): the meeting attendance log
  * `dateTime` (body): the UTC date and time of the meeting (ISO 8601 formatted)
  * `discussion` (body): the meeting minutes and discussion notes
  * `location` (body): the meeting location
  * `newActions` (body): details of any newly agreed actions and their assignees
  * `previousActions` (body): details of previously agreed actions and whether
  they were completed

## POST /api/meeting/:meeting/dispute

Records a dispute against a specific meeting.

* **Handler**: `meetingController.addMeetingDispute`
* **Access control**: student member of specified team
* **Parameters**:
  * `meeting` (path): the ObjectId of the meeting
  * `notes` (body): the reasons for the dispute

## PATCH /api/meeting/:meeting/dispute

Updates the status of a meeting dispute.

* **Handler**: `meetingController.updateMeetingDispute`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `meeting` (path): the ObjectId of the meeting
  * `dispute` (body): the ObjectId of the dispute
  * `status` (body): the new status code of the dispute
