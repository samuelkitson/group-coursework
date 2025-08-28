# Local development

> [!IMPORTANT]
> This technical guide is intended for developers.

This project can be run locally using the provided `docker-compose.yml` file.
This allows for easy local development and testing in a realistic environment.

## Containers and services

* `nginx` starts a simple nginx server, with reverse proxies to both the
`frontend` and `api` services. The configuration file is at `nginx/nginx-dev.conf`
and is set up to expose the app on port 80.
* `mongo` is the MongoDB database server. The default credentials are defined in
the `.env` file.
* `api` is the ExpressJS API service. The nginx reverse proxy makes it available
under `/api`.
* `frontend` is the React app. Vite is used for hot-reloading so that if edits
are made to the React source code, the app is updated in real-time to reflect
these changes.
* `mailhog` is a fake SMTP server used to test email sending.
* `mongodb_data` is the volume that stores the MongoDB database. This uses a
volume so that the data isn't lost if the `mongo` container crashes.

## Initial database setup

The file `dev-mongo-init.js` is used to populate the database when the Docker
container starts. By default, it has three test users (each with the password
`groupcoursework`) and one test assignment. If you need more data, you can add
it to this file or add it directly to the database container via a shell.

## Useful commands

To start the application, run:

```docker-compose up -d```

The app should then be available at http://localhost and you will be able to
log in with the test credentials described in the section above.

The frontend app should hot-reload using Vite, but if you make changes to the
Express.js API you may need to manually refresh the container. You can do this
by running:

```docker-compose up -d --force-recreate api```

If you need to view the logs on a container, run:

```docker-compose logs api --follow```

To shut down the services, but keep the database contents, run:

```docker-compose down```

To shut down the services and wipe the database, run:

```docker-compose down -v```

To get a shell on the MongoDB container, run:

```docker compose exec mongo mongosh -u root -p bpY0zlso82YUQyyZcAdLhu --authenticationDatabase admin groupsappdb```

To use a helper script, run:

```docker-compose exec api npm run account-editor```

If you need to test email sending, you can access the mailhog interface at
http://localhost:8025/.
