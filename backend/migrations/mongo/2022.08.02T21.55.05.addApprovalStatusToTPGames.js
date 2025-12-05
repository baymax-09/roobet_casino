const GAME_COLLECTION = 'tp_games'
const GAME_BLOCKS_COLLECTION = 'tp_blocks'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {
  const connection = mongo.connection
  const db = connection.db

  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  try {
    // Check if there are games that don't have approvalStatus
    const gamesWithoutApprovalCursor = await db.collection(GAME_COLLECTION)
      .find({ approvalStatus: { $exists: false } })
      .sort({ identifier: 1 })
    const gameCount = await gamesWithoutApprovalCursor.count()

    if (gameCount) {
      // Update all games to 'approved'
      const update = { $set: { approvalStatus: 'approved' } }
      while (await gamesWithoutApprovalCursor.hasNext()) {
        const gameId = (await gamesWithoutApprovalCursor.next())._id
        await db.collection(GAME_COLLECTION).updateOne({ _id: gameId }, update)
      }

      // Set all current disabled games to 'declined'
      // (Only for games that have been exclusively disabled, not disabled by provider)
      const activeIdentifierBlocksCursor = await db.collection(GAME_BLOCKS_COLLECTION).find({ key: 'identifier' })
      const declinedUpdate = { $set: { approvalStatus: 'declined' } }
      while (await activeIdentifierBlocksCursor.hasNext()) {
        const blockedIdentifier = (await activeIdentifierBlocksCursor.next()).value
        await db.collection(GAME_COLLECTION).updateOne({ identifier: blockedIdentifier }, declinedUpdate)
      }
    }
  } catch (error) {
    throw error
  }
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {
  const connection = mongo.connection
  const db = connection.db

  const gamesWithApprovalCursor = await db.collection(GAME_COLLECTION)
    .find({ approvalStatus: { $exists: true } })
    .sort({ identifier: 1 })

  while (await gamesWithApprovalCursor.hasNext()) {
    const gameId = (await gamesWithApprovalCursor.next())._id
    await db.collection(GAME_COLLECTION).updateOne({ _id: gameId }, { $unset: { approvalStatus: 1 } })
  }
}