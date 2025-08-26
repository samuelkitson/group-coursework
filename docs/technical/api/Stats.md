# Stats endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/stats`.

## GET /stats/skills

Calculates the frequency of each rating score for each required skill on the
given assignment, from the questionnaires submitted by the students on it.

* **Handler**: `statsController.skillsBreakdown`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response object**:
  * `skills`: frequency of each rating score (from 1 to 7) for each skill
  * `studentCount`: the number of students on the assignment

## GET /stats/team-skills

Generates statistics about the skill ratings submitted by each of the team's
members. Used to generate team skill charts.

* **Handler**: `statsController.skillsBreakdown`
* **Access control**: member, supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
* **Response object**:
  * `skills`: team best rating and user's own rating for each skill

## GET /stats/team-meetings

Generates statistics about the meeting records for the specified team. Used to
show statistics cards on the assignment overview page for students.

* **Handler**: `statsController.teamMeetingsBreakdown`
* **Access control**: member, supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of the team
* **Response object**:
  * `meetingsCount`: number of meetings recorded so far
  * `lastMeetingDate`: date of the most recent meeting
  * `outstandingActionsCount`: number of outstanding actions to complete before
  the next meeting

## GET /stats/questionnaire-engagement

Generates statistics about the completion rate of the skills questionnaire for
an assignment in the `allocation-questions` state.

* **Handler**: `statsController.questionnaireEngagement`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response object**:
  * `complete`: number of completed skill questionnaires
  * `incomplete`: number of incomplete skill questionnaires
  * `total`: number of students who have been asked to complete it
  * `reminderSent`: true if reminder emails have been sent about this
  assignment's skill questionnaire
