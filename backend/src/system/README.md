# System

## MongoDB

We use Mongoose to communicate with MongoDB which is hosted by Mongo Atlas. We use some Mongoose plugins, including

- [mongoose-lean-virtuals](https://github.com/mongoosejs/mongoose-lean-virtuals)
  - Used to attach virtuals to the results of mongoose lean() queries
- [mongoose-delete](https://github.com/dsanel/mongoose-delete)
  - Enables us to have soft deletes without being repetitive in our document models.

## Testing

### DB Outages

To test database failure:

Clusterize your local RethinkDB, in two separate shells

```sh
rethinkdb --port-offset 1 --join localhost:29015
```

```sh
rethinkdb --port-offset 2 --join localhost:29015
```

Now turn on sharding in the rethinkdb tables

```js
r.db('atlanta')
  .tableList()
  .forEach(function (table) {
    return r.db('atlanta').table(table).reconfigure({
      shards: 3,
      replicas: 3,
    })
  })
```

now run crash

```sh
WORKER=crash npm run dev
```

and in a different window

```sh
WORKER=genericFeeds npm run dev
```

To run a migration locally on app startup:

```sh
WORKER=migrate npm run dev
```

Now to test failure of the database kill one of the RethinkDB nodes.
You'll see that the crash process attempts to reboot itself.
