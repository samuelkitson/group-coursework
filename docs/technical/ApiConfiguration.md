# API configuration

> [!IMPORTANT]
> This technical guide is intended for developers.

The API is configured through the use of environment variables. These variables
and their options are detailed in this guide. Environment variables are required
unless otherwise specified and can be provided in any order.

## BASE_URL

The root URL of the site, for example `https://groupwork.example.org/`. This is
used to generate links in automated emails.

## SESSION_SECRET

A random string to be used as the secret to sign the Express.js session cookies.
For more information, see the [express-session documentation](https://expressjs.com/en/resources/middleware/session.html#secret).

## API_PORT

The port on which to host the API. This needs to match the port configured in
the Nginx reverse proxy.

## MONGO_URI

The MongoDB connection URI, including the username and password. For example:
`mongodb://username:password@mongo:27017/groupsappdb?authSource=admin`.

## ASSIGNMENTS_ADMIN_LOCK

[Optional] If set to `true`, only users whose role is `admin` will be allowed to
create new assignments. Otherwise, any staff will have this ability. This is
useful for locking down the app during the initial rollout.

## ALLOWED_EMAIL_DOMAINS

A comma-separated list of domain names that are valid email domains for user
accounts. For example: `university.ac.uk, school.university.ac.uk, example.org`.
It's recommended that you include `example.org` as this enables special
demonstration accounts to be added.

> [!NOTE]
> The following environment variables are for configuring the automated emails
> that the system can send. These can be safely omitted to disable email
> sending. Note that currently unauthenticated SMTP is the only way to send
> emails.

## SMTP_SERVER

[Optional] The domain name of the SMTP server used to send emails.

## SMTP_PORT

[Optional] The SMTP server port to use for sending emails.

## SMTP_SECURE

[Optional] Set to `true` or `false`. Determines whether `nodemailer` uses secure
mode to send emails.

## SMTP_FROM_ADDRESS

[Optional] The email address to use as the "From" address.

## ALLOW_EXAMPLE_ORG

[Optional] By default, any emails sent to addresses at example.org will be
suppressed. This is to prevent emails being sent to non-existent addresses
during testing. Set to `true` to allow emails to be sent to these addresses.

> [!NOTE]
> The following environment variables are for configuring Login with Microsoft.
> They can be omitted to disable this feature or for local testing, but you will
> need to manually change all user roles from `"placeholder"` and set passwords.

## AZURE_TENANT_ID

The Microsoft Azure (Entra) tenant ID.

## AZURE_CLIENT_ID

The Microsoft Azure (Entra) client ID.

## AZURE_KEY

Path to the private key file for the Microsoft Azure app registration.

## AZURE_THUMBPRINT

The thumbprint of the Microsoft Azure certificate.

## OAUTH_REDIRECT_URI

The URL that Microsoft should redirect users to after login. This should be the
`BASE_URL` followed by `login-callback`.
