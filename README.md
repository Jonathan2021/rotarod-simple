This was developped with and for Windows. Unix-like systems might require some slight changes.

##Prerequisites

Make sure you have the following software installed. The versions mentioned are the ones this project was developed with; newer versions will likely work but have not been tested.

    Node.js (v20.3.0)
    npm (v9.6.7)
    PM2 (v5.3.0)
    npx (v9.6.7)
    Typescript (v5.1.3) (globally installed)

You can install PM2 and Typescript globally using:
`npm install -g pm2 typescript`

## Setup

To set up the project on your local machine, follow these steps:

- ### Clone the Repository

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

- ### Install Local Dependencies

Inside the project folder, run:

`npm install`

This will read the package.json file and install all the necessary local dependencies.

- ### Create the database

Paths to the SQLite databse file for either environments are modifiable in `utils.ts` (make sure the folders exist before running the following).

Inside the project folder, run:
`./db-init.sh production` for production
`./db-init.sh development` for development



- ### Start the Project

After installing the dependencies, you can start the project with pm2 using:

`./start.sh --env production` (no `--env` or `--env development` for the development environment)

If you do not wish to use PM2, run with:
`NODE_ENV=production npx ts-node server.ts` (replace `production` with `development` if needed)

or with:
`npm start` This will run the command specified under the "start" script in your package.json, which starts the development server.