const GAME_COLLECTION = 'tp_games'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {
    const connection = mongo.connection
    const db = connection.db

    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    try {
        const gamesWithVacuousProducerOverridesCursor = await db.collection(GAME_COLLECTION).aggregate([
            {
                '$match': {
                    'overrides.producer': {
                        '$exists': true
                    }
                }
            }, {
                '$project': {
                    'overrides': 1,
                    'producer': 1,
                    'provider': 1,
                    'producerInternal': 1,
                    'providerInternal': 1,
                    'acmp': {
                        '$cmp': [
                            '$overrides.producer', '$provider'
                        ]
                    }
                }
            }, {
                '$match': {
                    'acmp': 0
                }
            }, {
                '$project': {
                    '_id': 1
                }
            }
        ])

        const update = { $unset: { 'overrides.producer': '' } }
        while (await gamesWithVacuousProducerOverridesCursor.hasNext()) {
            const gameId = (await gamesWithVacuousProducerOverridesCursor.next())._id
            await db.collection(GAME_COLLECTION).updateOne({ _id: gameId }, update)
        }
    } catch (error) {
        throw error
    }
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => { }