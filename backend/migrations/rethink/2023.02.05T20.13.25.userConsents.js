/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db, mongo, megalo } }) => {

  // Mongo consents collection setup
  const mongoConnection = mongo.connection
  const mongoDB = mongoConnection.db
  const consents = mongoDB.collection('consents')

  // Megalo kyc_v2 collection setup
  const megaloConnection = megalo.connection
  const megaloDB = megaloConnection.db
  const kycV2 = megaloDB.collection('kyc_v2')

  // Rethink users table setup
  const User = r.db(db).table('users')
  
  // Get all records in the users table
  const cursor = await User.run(rethinkConnection, { cursor: true })

  const BATCH_SIZE = 500
  let users = []

  // Used for bulk inserting the users into the consents collection
  const bulkInsertUsers = async () => {
    // Find all consents that have the userId
    const userIds = users.map(user => user.userId)
    const foundConsents = await consents.find({ userId: { $in: userIds } }).toArray()
    const foundUserIds = foundConsents.map(consent => consent.userId)

    // Don't insert for that userId if they already have a consent
    const filteredUsers = users.filter(user => !foundUserIds.includes(user.userId))
    const filteredUserIds = filteredUsers.map(user => user.userId)

    // Check if phoneVerified for user
    const kycV2UserDocuments = await kycV2.find({ userId: { $in: filteredUserIds } }).toArray()

    // Map the appropriate phone data
    const phonesVerified = kycV2UserDocuments.map(document => ({
      userId: document.userId,
      phoneVerified: document?.phoneVerified ? document.phoneVerified : false,
    }))
    // Map combine the phoneVerified with the emailVerified + userId
    const finalUsers = filteredUsers.map(user => {
      const phone = phonesVerified.find(element => element.userId === user.userId)
      if (!phone) {
        return user
      }
      return {
        ...user,
        ...phone,
      }
    })

    const documentsToUpdate = finalUsers.map(user => ({
      email: user.emailVerified,
      sms: user.phoneVerified,
      telephone: false,
      postMail: false,
      siteNotification: true,
      pushNotification: false,
      userId: user.userId
    }))

    if (documentsToUpdate.length === 0) {
      return
    }
    // Bulk insert all the documents
    await consents.insertMany(documentsToUpdate)
    users = []
  }

  while (true) {
    try {
      const row = await cursor.next()

      // Check if the user id already has consents, if not then create them
      const userId = row['id']
      // Check if emailVerified for user
      const emailVerified = row['emailVerified']

      users.push({
        userId,
        emailVerified: emailVerified,
        phoneVerified: false,
      })

      if (users.length === BATCH_SIZE) {
        await bulkInsertUsers()
      }
    } catch (error) {
      // This error will be thrown when there are no more rows
      if (error.name === 'ReqlDriverError' && error.message === "No more rows in the cursor.") {
        await bulkInsertUsers()
      }
      break
    }
  }
  cursor.close()
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { mongo } }) => {
  // Mongo consents collection setup
  const connection = mongo.connection
  const mongoDB = connection.db
  const consents = mongoDB.collection('consents')

  // Delete all documents in consents in collection
  await consents.deleteMany({})
}
