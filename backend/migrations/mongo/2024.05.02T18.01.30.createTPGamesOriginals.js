const GAME_COLLECTION = 'tp_games'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {
    const connection = mongo.connection
    const db = connection.db

    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    try {
        const gamesWithOverridesCursor = await db.collection(GAME_COLLECTION).find().sort({ gameIdentifier: 1 })

        while (await gamesWithOverridesCursor.hasNext()) {
            const game = await gamesWithOverridesCursor.next()
            const update = { $set: { 'originals': {
                'title': game.title,
                'payout': game.payout,
                'provider': game.provider,
                'category': game.category,
                'description': game.description,
                'identifier': game.identifier,
                'blacklist': game.blacklist,
            }}}
            await db.collection(GAME_COLLECTION).updateOne({ _id: game._id }, update)
        }
    } catch (error) {
        throw error
    }
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {};