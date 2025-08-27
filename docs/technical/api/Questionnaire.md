# Questionnaire endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/questionnaire`.

## GET /api/questionnaire/skills

Retrieves the pre-allocation skills questionnaire questions for the specified
assignment.

* **Handler**: `questionnaireController.getAllocationQuestionnaire`
* **Access control**: student on specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment
* **Response object**:
  * `questionnaire`: the skills, their descriptions and the current ratings

## PATCH /api/questionnaire/skills

Updates the user's ratings for their skills in the specified assignment.

* **Handler**: `questionnaireController.updateUserSkills`
* **Access control**: student on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `skills` (body): the updated user ratings of their skills

## GET /api/questionnaire/existing-skills

Retrieves a list of every skill that has previously been configured for
assignments on the system. Used for autofill on the assignment configuration
page.

* **Handler**: `questionnaireController.allExistingSkills`
* **Access control**: staff
* **Response object**:
  * `skills`: list of existing configured skills and their descriptions

## POST /api/questionnaire/reminders

Sends reminder emails to all students on the assignment to ask them to complete
the skills questionnaire.

* **Handler**: `questionnaireController.sendReminders`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (body): the ObjectId of the assignment
  * `force` (body): allows second reminders to be sent
