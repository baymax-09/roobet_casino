const GAME_COLLECTION = 'tp_games'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {
  const connection = mongo.connection
  const db = connection.db

  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  try {
    const gamesCursor = await db.collection(GAME_COLLECTION).find({}).sort({ gameIdentifier: 1 })

    const update = { $unset: { largeImage: '', image: '', recalled: '', whitelist: '' } }
    while (await gamesCursor.hasNext()) {
        const gameId = (await gamesCursor.next())._id
        await db.collection(GAME_COLLECTION).updateOne({ _id: gameId }, update)
    }
  } catch (error) {
    throw error
  }
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => { }