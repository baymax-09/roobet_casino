const { Umzug, MongoDBStorage } = require('umzug')
const mongoose = require('mongoose')

;(async () => {
  const mongooseConnection = await mongoose.connect(process.env.MEGALOMONGO_URI || 'mongodb://127.0.0.1:27018/roobet_megalo?replicaSet=rs0&directConnection=true')

  const umzug = new Umzug({
    migrations: { glob: 'migrations/megalo/*.js' },
    context: mongooseConnection,
    storage: new MongoDBStorage(mongooseConnection),
    logger: console,
  })

  exports.umzug = umzug

  if (require.main === module) {
    umzug.runAsCLI()
  }
})()

