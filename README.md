# Group Coursework App
This is the code repository for the web app used to help support and manage
group coursework assignments at university.

## History
This was originally an undergraduate final year project in 2025, built by Sam
Kitson (sk6g22).

## Local testing with Docker-Compose
A local instance of the system can be started and tested using docker-compose.
The `docker-compose.yml` file defines a number of services:

* `nginx` starts a simple nginx server, with reverse proxies to both the
`frontend` and `api` services. The configuration file is at `nginx/nginx-dev.conf`
and is set up to expose the app on port 80.
* `mongo` is the MongoDB database server. The default credentials are defined in
the `.env` file.
* `api` is the ExpressJS API service. The nginx reverse proxy makes it available
under `/api`.
* `frontend` is the React app. Vite is used for hot-reloading so that if edits
are made to the React source code, the app is upadted in real-time to reflect
these changes.
* `mongodb_data` is the volume that stores the MongoDB database. This uses a
volume so that the data isn't lost if the `mongo` container crashes.

### Environment variables
Configure the following environment variables in `.env` at the project root:
* `SESSION_SECRET`: a random string used for signing by `express-session`.
* `MONGO_ROOT_USERNAME`: the MongoDB root username.
* `MONGO_ROOT_PASSWORD`: the MongoDB root password.
* `MONGO_DATABASE`: the name of the the database to use.
* `API_PORT`: the internal port to run the API from (default 3000).
* `MONGO_URI`: the MongoDB connection URI.
* `FRONTEND_PORT`: the internal port to run the frontend from (default 5173).
* `VITE_API_URL`: set to `/api`.

### Commands
To start up the services, run:

```docker-compose up -d```

To check the logs for a service, e.g. the API, run:

```docker-compose logs api --follow```

To restart the API with updated code, run:

```docker-compose up -d --force-recreate api```

To shut down the services, but keep the database contents, run:

```docker-compose down```

To shut down the services and wipe the database, run:

```docker-compose down -v```

To get a shell on the MongoDB database, run:

```docker compose exec mongo mongosh -u <USERNAME> -p <PASSWORD> --authenticationDatabase admin <DBNAME>```

## VPS configuration information
Nodemon is used on the server to watch for any changes to the Express server and automatically restart it in case of changes. For more information, see: https://www.digitalocean.com/community/tutorials/workflow-nodemon#step-2-setting-up-an-example-express-project-with-nodemon
