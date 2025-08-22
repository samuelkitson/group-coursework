# Allocation endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/allocation`.

## GET /api/allocation/:assignment/options

Used to get the list of criteria and dealbreakers available to the lecturer when
they're configuring allocation. These are pulled from `allocationOptions.js`.

* **Handler**: `allocationController.getAllocationOptions`
* **Access control**: lecturer on provided assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
* **Response object**:
  * `criteria`: the available allocation criteria.
  * `dealbreakers`: the available allocation dealbreakers.
  * `skills`: the required skills configured for the skills questionnaire.


## GET /api/allocation/:assignment/setup

Retrieves the current allocation configuration for the given assignment. 

* **Handler**: `allocationController.getAllocationSetup`
* **Access control**: lecturer on provided assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
* **Response object**:
  * `groupSize`: preferred group size
  * `surplusLargerGroups`: if true, make larger groups when the class won't
  split evenly
  * `criteria`: currently configured criteria
  * `dealbreakers`: currently configured deal-breakers

## PUT /api/allocation/:assignment/setup

Updates the current allocation configuration for the given assignment. Checks
are made to ensure that all of the provided criteria and dealbreakers are valid
options from `allocationOptions.js`.

* **Handler**: `allocationController.setAllocationSetup`
* **Access control**: lecturer on provided assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `groupSize` (body): the new target group size
  * `surplusLargerGroups` (body): if true, make larger groups when the class
  won't split evenly
  * `criteria` (body): the new allocation criteria
  * `dealbreakers` (body): the new allocation dealbreakers

## POST /api/allocation/:assignment/run

Runs the allocation algorithm for the assignment using the configured options.
It optionally accepts a dataset file that will be passed to the algorithm but
only kept in memory for the duration of the algorithm execution. This endpoint
can take a while to respond.

* **Handler**: `allocationController.runAllocation`
* **Access control**: lecturer on provided assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `dataset` (file): the optional additional dataset about students
* **Response object**:
  * `allocation`: the full details of the best generated allocation
  * `criteria`: the criteria used to generate this allocation
  * `dealbreakers`: the dealbreakers used to generate this allocation
  * `executionTime`: the time taken to run allocation, in milliseconds
  * `fitness`: the overall allocation fitness, from 0 to 1

## POST /api/allocation/:assignment

Used to confirm the chosen allocation. The provided allocation will be checked
for validity (note that it will not be checked against the criteria/dealbreakers
but simply checked for cases such as one student in two teams) before being
released to students.

* **Handler**: `allocationController.confirmAllocation`
* **Access control**: lecturer on provided assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `allocation` (body): the chosen allocation of teams
