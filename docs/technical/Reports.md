# Progress reports (technical information)

> [!IMPORTANT]
> This technical guide is intended for developers.

This guide outlines some of the advanced features of the progress reports tool
that may be useful for developers looking to integrate this app with other
systems.

## Current technical setup

The form at `/assignment/reports` really just constructs the correct URL
required to view/download a report.

Reports themselves are static HTML documents generated entirely by the backend
API. They are not part of the frontend and do not use React, though use similar
styling as they load in Bootstrap from a CDN. The rationale for this is that
reports may need to be stored separately and shared with people who wouldn't
normally have access the the system; for example, external moderators.

Loading Bootstrap from the CDN means that an internet connection is needed to
view downloaded reports, though users don't need to be logged into the system or
even on the same network. If reports need to be viewed truly offline, they can
be printed or saved as a PDF.

On the backend, `reportController.js` is responsible for generating the data
used to produce reports. For each team, a "render object" containing the data
is generated. These are then used to populate an EJS template.

## Integrating with other systems

Reports contain a large quantity of data that may be useful for marking or other
processes. This may require importing that data into other University systems.
Some shortcuts have been included to make this easier to implement:

### postMessage links

The HTML reports contain some JavaScript that calls `window.postMessage()` when
any of the peer review or observations are clicked. The data passed is an object
containing:

* `commentText`: the (moderated) text content of the review or observation.
* `recipientName`: the display name of the student who the comment is about.
* `recipientEmail`: the email of the student who the comment is about.
* `recordedBy`: for display name of the user who recorded the review or
observation.
* `moderated`: true if the comment was moderated by a supervisor/staff member.

The intention here is that the report could be loaded as an iframe into a
marking tool, with the shortcut allowing a staff member to click a comment and
have its contents automatically copied into a form field on the parent page.

### JSON formatted reports

A hidden option exists that allows reports to be exported as raw JSON. To enable
this mode, simply append `format=json` to any `/api/report` URL. For reports
about individual teams, this will return the object that would otherwise be used
to populate the EJS template. For bulk reports, this returns an array of those
objects (one per team).
