# Helper scripts

> [!IMPORTANT]
> This technical guide is intended for developers.

A number of helper scripts are provided to make administration work on the
server simpler. They also remove the need to log into the database directly, 
reducing the risk of accidental changes that cause data loss.

The scripts are run using npm on the server's command line and don't require any
additional authentication. The available scripts are described below.

## Admin account editor

```npm run admin-accounts```

This tool can be used to edit the list of users with the `admin` role. This is a
staff role with some additional permissions, namely access to endpoints under
`/api/test` and the ability to create assignments when `ASSIGNMENTS_ADMIN_LOCK`
is enabled.

It provides the abililty to list the current admins, add a new admin or remove
an existing one.

## Account editor

```npm run account-editor```

This tool allows you to edit certain account attributes that aren't normally
editable. You can:

* Change a user's email address. If you do this, make sure that it matches their
User Principal Name to allow them to log in with Microsoft.
* Change a user's display name. If their display name is not syncing from
Microsoft, you can manually update it here. Note that this may automatically
revert the next time they log in with Microsoft.
* Change a user's account role. If a user was previously a student and is now a
staff member, and the system hasn't detected this automatically, this is a handy
way to fix this.
* Enable password login for a user. If a user can't log in with Microsoft, you
can set a password for them here. Note that there is no way for the user to
update the password themselves. If they have never logged in with Microsoft, you
will also need to set their account role.
* Disable password login for a user. This restricts a user to logging in with
Microsoft only.
* Delete a user's account. Refrain from using this option unless absolutely
necessary. Deleting a user who is still referenced in teams, meetings and more
will cause unexpected behaviour.

## Create account

```npm run create-account```

This tool allows you to create a one-off account directly. You shouldn't need to
do this normally as accounts will be created for users who log in with Microsoft
automatically. You may need to do this to create testing or demonstration
accounts.

You will be asked to provide an email address, display name, user role and a
password (>8 characters long).

## Database reset

> [!CAUTION]
> This tool can delete most of your database very quickly! Be careful.

```npm run database-reset```

This tool can be used to reset some or all of the database. The options are:

* Erase placeholder accounts. These are accounts that were automatically
created for users but never actually logged into.
* Erase all user accounts.
* Erase all closed assignments. This is useful for cleaning up old data.
* Erase all assignments and related data.
