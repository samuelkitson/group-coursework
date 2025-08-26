# Student endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/student`.

## POST /api/student/enrol

Accepts a CSV file of student names and email addresses to be added to an
assignment. Automatically creates placeholder accounts for students who aren't
yet set up with an account in the system.

* **Handler**: `studentController.enrolStudentsOnAssignment`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `mode` (body): if adding students when the assignment is live, this
  specifies whether to add them to existing teams (`existing`) or a single new
  team (`new`)
  * `students` (file): CSV file of student names and email addresses (UPNs)

## PATCH /api/student/unenrol

Removes a student from the specified assignment.

* **Handler**: `studentController.removeFromAssignment`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `student` (body): the ObjectId of the student to remove

## POST /api/student/unenrol-all

Removes all students from the specified assignment. Only available if the
assignment is in the pre-allocation state.

* **Handler**: `studentController.removeAllFromAssignment`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment

## PUT /api/student/exclusions

Updates the list of pairing exclusions for a student. Note that a student might
have exclusions set with students not on the current assignment - the ObjectIds
of these other students should still be provided here.

* **Handler**: `studentController.setPairingExclusions`
* **Access control**: staff
* **Parameters**:
  * `student` (body): the ObjectId of the student to add pairing exclusions for
  * `others` (body): list of ObjectIds of other students to exclude them from
  being put in a group with

## GET /api/student/profile

Retrieves the student profile for the current student.

* **Handler**: `studentController.getProfile`
* **Access control**: student
* **Response object**:
  * `profile`: the current profile details for the student

## PATCH /api/student/profile

Updates the student profile for the current student.

* **Handler**: `studentController.updateOwnProfile`
* **Access control**: student
* **Parameters**:
  * `meetingPref` (body): the student's new meeting preference (`online`,
  `in-person` or `either`)
  * `bio` (body): the student's new profile bio
