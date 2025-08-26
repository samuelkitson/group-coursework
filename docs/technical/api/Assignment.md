# Assignment endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/assignment`.

## POST /api/assignment

Creates a new assignment.

* **Handler**: `assignmentController.createAssignment`
* **Access control**: staff, or admin only if ASSIGNMENTS_ADMIN_LOCK is set
* **Parameters**:
  * `name` (body): the short name of the new assignment
  * `description` (body): a longer description of the new assignment
* **Response object**:
  * `assignmentId`: the ObjectId of the new assignment

## GET /api/assignment/all

Retrieves a list of all assignments visible to the current user.

* **Handler**: `assignmentController.getAllVisible`
* **Access control**: logged in
* **Response object**: list of assignment details

## DELETE /api/assignment/:assignment

Deletes the specified assignment. The `force` parameter must be set unless the
assignment is in the `pre-allocation` state.

* **Handler**: `assignmentController.deleteAssignment`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `force` (body): set to true to confirm deletion of an in-progress assignment

## PATCH /api/assignment/:assignment

Updates the name and description of the specified assignment.

* **Handler**: `assignmentController.updateAssignmentInfo`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `name` (body): the new short name of the assignment
  * `description` (body): the new description of the assignment

## GET /api/assignment/:assignment/students

Retrieves the details of all students on the specified assignment.

* **Handler**: `assignmentController.getEnrolledStudents`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
* **Response object**: list of students

## GET /api/assignment/:assignment/skills

Retrieves the details of the required skills configured for the specified
assignment. These are the skills that are asked about in the allocation
questionnaire.

* **Handler**: `assignmentController.getSkills`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
* **Response object**: list of skills

## PATCH /api/assignment/:assignment/skills

Updates the details of the required skills for the specified assignment.

* **Handler**: `assignmentController.setSkills`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `skills` (body): list of required skills and their details

## PATCH /api/assignment/:assignment/state

Changes the state of the specified assignment. If the user is attempting to move
it to a non-standard next state, the force parameter is required to confirm the
change.

* **Handler**: `assignmentController.setState`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `state` (body): the ID of the new state
  * `force` (body): set to true to confirm a move to a non-standard next state

## PUT /api/assignment/:assignment/staff

Updates the staff list for an assignment. When processing this request, the API
will automatically email any staff newly added to the assignment.

* **Handler**: `assignmentController.setStaff`
* **Access control**: lecturer on specified assignment 
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `staff` (body): list of staff user IDs
