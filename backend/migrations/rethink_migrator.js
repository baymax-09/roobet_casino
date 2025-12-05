const { Umzug, MongoDBStorage } = require('umzug')
const mongoose = require('mongoose')
const rethinkdbdash = require('rethinkdbdash')

const toInt = (envVar) => (envVar ? parseInt(envVar) : null)
const toFloat = (envVar) => (envVar ? parseFloat(envVar) : null)

const rethinkdb = {
  // "readMode": "outdated",
  shardsPerTable: toInt(process.env.RETHINKDB_SHARDS_PER_TABLE) || 1,
  buffer: 5,
  changefeedReconnectOptions: {
    attemptDelay: 3000,
    maxAttempts: 600,
    silent: false,
  },
  db: process.env.RETHINKDB_DB,
  discovery: false, // process.env.RETHINKDB_DISCOVERY == "true",
  host: process.env.RETHINKDB_HOST,
  max: 5000,
  password: process.env.RETHINKDB_PASSWORD,
  pingInterval: 0,
  // "pool": (process.env.RETHINKDB_POOL || "true") == "true",
  port: process.env.RETHINKDB_PORT,
  // "shardsPerTable": toInt(process.env.RETHINKDB_SHARDS_PER_TABLE) || 1,
  rejectUnauthorized: false,
  timeout: toInt(process.env.RETHINKDB_CONNECTION_TIMEOUT) || 30,
  timeoutError: toInt(process.env.RETHINKDB_TIMEOUT_ERROR) || 10000,
  timeoutGb: 3600000,
  user: process.env.RETHINKDB_USER,
}
  // This file exists for leveraging the umzug CLI tool
  ; (async () => {
    const [mongo, megalo] = await Promise.all([
      new mongoose.Mongoose().connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roobet?replicaSet=rs0&directConnection=true'),
      new mongoose.Mongoose().connect(process.env.MEGALOMONGO_URI || 'mongodb://127.0.0.1:27018/roobet_megalo?replicaSet=rs0&directConnection=true'),
    ])
    const db = 'atlanta'
    const r = rethinkdbdash(rethinkdb)
    const rethinkConnection = await r.connect({ host: process.env.RETHINKDB_HOST })

    const umzug = new Umzug({
      migrations: { glob: 'migrations/rethink/*.js' },
      context: { r, rethinkConnection, db, mongo, megalo },
      storage: new MongoDBStorage(mongo),
      logger: console,
    })

    exports.umzug = umzug

    if (require.main === module) {
      umzug.runAsCLI()
    }
  })()