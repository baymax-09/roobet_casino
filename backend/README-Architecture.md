# Architecture

## Project Structure

```text
📦 roobet-backend
┣ 📂 docs
┃ ┗ 📜 OpenAPI docs
┣ 📂 local
┃ ┗ 📜 Docker config for local env
┣ 📂 locales
┃ ┗ 📜 i18n json
┣ 📂 migrations
┃ ┗ 📜 Umzug scripts for data backfills
┣ 📂 scripts
┃ ┗ 📜 dev + ops docker / shell scripts
┣ 📂 src
┃ ┣ 📂 modules
┃ ┃ ┣ 📂 example-module
┃ ┃ ┃ ┗ see ## Module Structure
┃ ┃ ┣ 📂 example-module-2
┃ ┃ ┃ ┗ see ## Module Structure
┃ ┃ ┗ 📜 index.ts (modules loaded here)
┃ ┣ 📂 system
┃ ┃ ┗ 📜 i18n, db integrations, elasticsearch, winston, etc.
┃ ┣ 📂 types
┃ ┃ ┗ 📜 custom declarations for external libraries
┃ ┣ 📂 util
┃ ┃ ┣ 📂 ...
┃ ┃ ┣ 📂 example-utility-module
┃ ┃ ┃ ┗ see ## Module Structure
┃ ┃ ┣ 📂 example-code-folder
┃ ┃ ┃ ┣ 📜 index.ts
┃ ┃ ┃ ┗ 📜 ...
┃ ┣ 📂 vendors
┃ ┃ ┣ 📂 example-vendor-integration
┃ ┃ ┃ ┗ see ## Module Structure
┃ ┃ ┣ 📂 example-vendor-integration-2
┃ ┃ ┃ ┗ see ## Module Structure
┃ ┗ 📜 index.ts (<- entrypoint)
┗ 📂 test
```

## Load Order

1. `src/index.ts`
2. `src/system`
3. `src/modules`
4. modules within `src/modules`
5. etc.

Utility code (`src/util`) is used throughout the application and should be as module-independent as possible.

## Module Structure

```text
📂 src/modules/example-module
┣ 📂 documents [optional]
┃ ┣ 📜 RethinkDB / Mongoose documents
┃ ┗ 📜 index.ts (must export DBSchema config)
┣ 📂 gql [optional]
┃ ┣ 📂 mutationFields [optional] (root mutation fields)
┃ ┣ 📂 subscriptionFields [optional] (root subscription fields)
┃ ┣ 📂 queryFields [optional] (root query fields)
┃ ┗ 📜 index.ts (must export the GQL schema for this module)
┣ 📂 lib [optional]
┃ ┗ 📜 additional source files
┣ 📂 routes [optional]
┃ ┣ 📜 Express & Sockets routes
┃ ┗ 📜 index.ts (must default export a router)
┣ 📂 types [optional]
┃ ┗ 📜 widespread types for this module
┣ 📂 workers [optional]
┃ ┣ 📜 worker process
┃ ┗ 📜 index.ts (must export worker functions)
┗ 📜 index.ts (must export any documents, workers, or routers)
```

Modules represent core app subsystems that optionally involve:

- some sort of data storage
- workers
- user interaction via routes

Ex: a `raffle` subsystem, with a raffle worker, some routes and a new table.

An example of a full module is `src/modules/user.ts`

This module structure is also used in `src/util` and `src/vendor`:

- full utility module: `src/util/named-lock`
- utility code folder: `src/util/redisModels`

## Module Loader

Modules are loaded in `src/modules/index.ts`.
New modules must be explicitly added to the loader.

The module loader does the following:

- mounts the routes
- ensures the indices are built
- ensures data is seeded for the documents in your module

## Data Layer

The application currently relies on two database platforms:

- RethinkDB (slated for deprecation, migrating to mongo)
- MongoDB (two databases; using [mongoose](https://mongoosejs.com/))
  - Mongo (collections of static or near-static length)
  - MegaloMongo (collections that perpetually grow)
