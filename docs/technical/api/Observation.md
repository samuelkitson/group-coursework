# Observation endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/observation`.

## POST /api/observation

Records a private observation against a specific team, and optionally tags it
with a list of related student IDs.

* **Handler**: `observationController.addObservation`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (body): the ObjectId of team
  * `comment` (body): the observation comment
  * `students` (body): optionally, a list of students to tag the observation
  with.

## GET /api/observation

Retrieves the list of private observations about a specific team.

* **Handler**: `observationController.getObservations`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (query): the ObjectId of team
* **Response object**:
  * `observations`: the list of observations about the team

## DELETE /api/observation/:observation

Deletes the specified observation.

* **Handler**: `observationController.deleteObservation`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `observation` (path): the ObjectId of observation
