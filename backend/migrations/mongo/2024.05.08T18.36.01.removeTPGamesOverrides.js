const GAME_COLLECTION = 'tp_games'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {
    const connection = mongo.connection
    const db = connection.db
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    try {
        const gamesWithOverridesCursor = await db.collection(GAME_COLLECTION).find({ overrides: { $exists : true } }).sort({ gameIdentifier: 1 })
        while (await gamesWithOverridesCursor.hasNext()) {
            const game = await gamesWithOverridesCursor.next()
            const update = { $unset: { 'overrides': '' }, $set: { ...game.overrides } }
            await db.collection(GAME_COLLECTION).updateOne({ _id: game._id }, update)
        }
    } catch (error) {
        throw error
    }
};
/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {};