# Test endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

> [!WARNING]
> These endpoints are for testing purposes and are only available to admins.
> They shouldn't need to be used day-to-day.

This file documents the API endpoints available under `/api/test`.

## GET /api/test/randomise-skill-ratings

Adds random skill ratings for each of the required skill, for each student on
the specified assignment.

* **Handler**: `testDataController.randomiseSkillRatings`
* **Access control**: admin on the specified assignment
* **Parameters**:
  * `assignment` (query): the ObjectId of the assignment

## GET /api/test/send-test-email

Tests the email sending functionality of the system by sending a test email to
the specified email address. The email address must belong to a user registered
in the system.

* **Handler**: `testDataController.sendTestEmail`
* **Access control**: admin
* **Parameters**:
  * `email` (query): the recipient's email address
