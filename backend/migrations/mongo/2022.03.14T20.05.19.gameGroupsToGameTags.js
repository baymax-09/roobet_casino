const GAME_COLLECTION = 'tp_games'
const GAME_GROUP_COLLECTION = 'tp_game_groups'
const GAME_TAG_COLLECTION = 'game_tags'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {

  const connection = mongo.connection
  const db = connection.db

  const session = connection.client.startSession()
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  try {
    await session.withTransaction(async () => {
      const games = await db.collection(GAME_COLLECTION).find({}).toArray()
      const gameGroups = await db.collection(GAME_GROUP_COLLECTION).find({}).toArray()
      const tagCollection = await db.collection(GAME_TAG_COLLECTION)
      const newTags = gameGroups.map(group => ({ _id: group._id, title: group.title, slug: group.slug }))
      if (newTags.length) {
        await tagCollection.insertMany(newTags)
      }
      if (gameGroups.length) {
        const gamesFromGroups = gameGroups.map(group => ({
          groupId: group._id.toString(),
          tpGameIds: group.games?.map(game => game.tpGamesId.toString()),
        }))

        let updatedGames = []

        gamesFromGroups.forEach(group => {
          games.forEach(game => {
            if (group.tpGameIds.includes(game._id.toString())) {
              const sameGameIndex = updatedGames
                .findIndex(game1 => game1.gameId.toString() === game._id.toString())

              if (sameGameIndex <= -1) {
                updatedGames = [...updatedGames,
                {
                  gameId: game._id,
                  tags: [group.groupId],
                },
                ]
              } else {
                updatedGames[sameGameIndex].tags = [
                  ...updatedGames[sameGameIndex].tags, group.groupId,
                ]
              }
            }
          })
        })
        // Atomic Updates
        // https://docs.mongodb.com/manual/reference/command/findAndModify/#comparisons-with-the-update-method
        for (const game of updatedGames) {
          await db.collection(GAME_COLLECTION).updateOne({ _id: game.gameId }, { $set: { tags: game.tags } })
        }
      }
    })
  } finally {
    await session.endSession()
  }
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {
  // We don't need a down as we are copying the game_groups collection to game_tags
}
