# Peer review endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/peer-review`.

## GET /api/peer-review

Gets the details of the peer review weeks configured for the specified
assignment. This should be treated as a timetable of the peer reviews that will
be (or have been) requested from students.

* **Handler**: `peerReviewController.getPeerReviewStructure`
* **Access control**: supervisor or lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
  * `pastOnly` (query): if set, only get peer reviews for previous weeks
  * `futureOnly` (query): if set, only get peer reviews for future weeks
  * `ignoreNone` (query): if set, only return details of simple or full weeks
* **Response object**:
  * `peerReviews`: list of the relevant peer reviews

## PUT /api/peer-review

Updates the peer review structure for the specified assignment.

* **Handler**: `peerReviewController.updatePeerReviewsByAssignment`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `peerReviews` (body): list of peer reviews to be configured

## POST /api/peer-review/reminders

Sends reminder emails to the students who are yet to complete the current live
peer review for the specified assignment. If reminders have already been sent
for this peer review, the `force` query parameter can be used to send them
again.

* **Handler**: `peerReviewController.sendReminderEmails`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `force` (body): if true, reminders to be sent again

## POST /api/peer-review/current-status

Gets the current status of peer reviews for the specified assignment.

* **Handler**: `peerReviewController.getCurrentStatus`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response object**:
  * `type`: the configured check-in type this week (disabled/none/simple/full)
  * `open`: if true, there is something for students to submit this week
  * `totalStudents`: number of students requested to submit a check-in
  * `unsubmittedCount`: number of students yet to submit this week
  * `submittedCount`: number of students who have submitted so far this week
  * `remindersSent`: if true, reminder emails have been sent this week already
