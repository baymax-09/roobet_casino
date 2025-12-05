const GAME_COLLECTION = 'tp_games'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo}) => {
    const connection = mongo.connection
    const db = connection.db
    await db.collection(GAME_COLLECTION).updateMany({}, [{ $set: { releasedAt: '$createdAt' } }])
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo}) => { 
    const connection = mongo.connection
    const db = connection.db
    await db.collection(GAME_COLLECTION).updateMany({}, [{ $unset: 'releasedAt' }]) 
};
