const KYC_V2_COLLECTION = 'kyc_v2'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {

  const connection = mongo.connection
  const db = connection.db

  const session = connection.client.startSession()
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  try {
    await session.withTransaction(async () => {
      await db.collection(KYC_V2_COLLECTION).updateMany({}, [{ $set: {
        firstName: { $trim: { input: '$firstName' } },
        lastName: { $trim: { input: '$lastName' } },
        searchName: { $trim: { input: '$searchName' } },
        addressLine1: { $trim: { input: '$addressLine1' } },
        addressLine2: { $trim: { input: '$addressLine2' } },
        addressCity: { $trim: { input: '$addressCity' } },
        addressPostalCode: { $trim: { input: '$addressPostalCode' } },
        addressState: { $trim: { input: '$addressState' } },
        addressCountry: { $trim: { input: '$addressCountry' } },
        dob: { $trim: { input: '$dob' } },
        phone: { $trim: { input: '$phone' } },
      }}])
    })
  } finally {
    await session.endSession()
  }
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {
  // We don't need a down as we are copying the game_groups collection to game_tags
}
