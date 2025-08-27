# Check-in endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/checkin`.

## GET /api/checkin

Gets the current check-in state for a student and a specified team that they're
a member of. Used by the check-in page to determine whether any responses are
required this week, which type is configured and whether the user has already
completed it or not.

* **Handler**: `checkinController.getCheckinStateStudent`
* **Access control**: student member of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
* **Response object**:
  * `type`: the configured check-in type this week (disabled/none/simple/full)
  * `open`: if true, the user has an outstanding check-in to complete
  * `name`: if configured, the name of the peer review week
  * `completionRate.done`: the number of team members who have completed this
  week's check-in
  * `completionRate.outOf`: the total number of team members who are due to
  complete this week's check-in
  * `questions`: for a full check-in, the skills to ask about
  * `teamMembers`: for a full check-in, the ObjectIds and display names of the
  other team members

## POST /api/checkin

Submits a check-in for the specified team.

* **Handler**: `checkinController.submitCheckIn`
* **Access control**: student member of specified team
* **Parameters**:
  * `team` (body): the ObjectId of the team
  * `effortPoints` (body): effort points allocated to each team member
  * `review` (body): detailed peer reviews for each team member (full check-ins)

## GET /api/checkin/history

Retrieves workload balance data over time for a team. This is used to generate
the workload balance chart.

* **Handler**: `checkinController.getCheckInHistory`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
* **Response object**:
  * `checkIns`: the weekly workload balance data
  * `thresholds`: boundaries for the red, yellow and green regions on the chart

## GET /api/checkin/response

Retrieves the full check-in responses for a specified team and peer review
point. 

* **Handler**: `checkinController.getCheckInResponse`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
  * `peerReview` (query): the ObjectId of the specific peer review point
* **Response object**:
  * `checkIns`: the workload balance scores submitted by each member
  * `thresholds`: boundaries for the red, yellow and green regions on the chart
  * `totalScores`: summed workload balance points for each team member
  * `normScores`: normalised workload balance (-3 to 3) for each team member
  * `skillRatings`: the ratings received for each member, for each skill
  * `reviewComments`: list of the review comments submitted

## PATCH /api/checkin/response

Used to moderate (edit or delete) a review comment.

* **Handler**: `checkinController.moderateResponse`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (body): the ObjectId of the team
  * `peerReview` (body): the ObjectId of the specific peer review point
  * `reviewer` (body): the ObjectId of the user who left the peer review
  * `recipient` (body): the ObjectId of the subject of the peer review
  * `moderatedComment` (body): the updated comment, or blank if it should be
  deleted
