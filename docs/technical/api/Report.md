# Report endpoints

> [!IMPORTANT]
> This technical guide is intended for developers.

This file documents the API endpoints available under `/api/report`.

## GET /api/report/team/:team

Generates an exportable report for a single team.

* **Handler**: `reportController.generateTeamReports`
* **Access control**: supervisor or lecturer of specified team
* **Parameters**:
  * `team` (path): the ObjectId of the team
  * `peerReview` (query): optionally, the specific peer review point to generate
  a report for
  * `periodStart` (query): optionally, a start date for the data used to create
  the report
  * `periodEnd` (query): optionally, an end date for the data used to create the
  report
  * `attachment` (query): if true, the `Content-Disposition` header is set to
  return the HTML document as an attachment
* **Response**: rendered HTML formatted report

## GET /api/report/assignment/:assignment

Generates a ZIP file of reports for each team on an assignment.

* **Handler**: `reportController.generateTeamReportsBulk`
* **Access control**: lecturer on specified assignment
* **Parameters**:
  * `assignment` (path): the ObjectId of the assignment
  * `peerReview` (query): optionally, the specific peer review point to generate
  reports for
  * `periodStart` (query): optionally, a start date for the data used to create
  the reports
  * `periodEnd` (query): optionally, an end date for the data used to create the
  reports
* **Response**: ZIP file of rendered HTML formatted reports
