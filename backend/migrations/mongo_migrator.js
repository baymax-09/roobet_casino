const { Umzug, MongoDBStorage } = require('umzug')
const mongoose = require('mongoose')
// This file exists for leveraging the umzug CLI tool
;(async () => {
  const mongooseConnection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roobet?replicaSet=rs0&directConnection=true')

  const umzug = new Umzug({
    migrations: { glob: 'migrations/mongo/*.js' },
    context: mongooseConnection,
    storage: new MongoDBStorage(mongooseConnection),
    logger: console,
  })

  exports.umzug = umzug

  if (require.main === module) {
    umzug.runAsCLI()
  }
})()

