# Data Migrations

We are using the library `umzug` for data migrations related to noSQL.
These are one off scripts that are reversible if they can be that change the state of our data as it is stored in Mongo or RethinkDB.
At the time of this writing there are 2 databases in Mongo.
There are a set of scripts available in the `package.json` that will run migrations up or down.

https://github.com/sequelize/umzug

To start a data migration first identify which database the collection lives on and create a migration:

For example if we were targeting the `roobet` database (in production this is "mongo" so mongo/roobet are the same):

`npm run migration:mongo:create --name=my-migration.js`

This will generate a file in `./migrations/mongo` called `my-migration.js` with a lexical timestamp prefix.

This file will have two functions in it an `up` and `down` please refer to the first migration to see how to access the mongoose instance via `context` property being passed in (`params.context`)

Once your migration up/down is completed you can test with the following commands:

`npm run migration:<dbname>:up`
`npm run migration:<dbname>:down`

You can always check the status of your migration by looking at the `migration` collection in your database as it will have an entry with every migration that has been run on the database.

The `npm run migrate` function will always run migrations up on all databases to the latest

`npm run migration:<dbname>:up` will run the data migrations up for the targeted database.
This is useful for testing and development. It will execute the `up` portion of the migration and insert an entry into the `migration` collection with the name of the migration file.

If a migration has a `down` function written for it (and it should if it's possible) when you run `npm run migration:<dbname>:down` it will revert the data migration changes to the previous state and remove the migration entry from the `migration` collection.

Note: Due to our mulitenant deployment you MUST check on the UP of you migration for the changes first, otherwise they will re-run with every pod deployment.
