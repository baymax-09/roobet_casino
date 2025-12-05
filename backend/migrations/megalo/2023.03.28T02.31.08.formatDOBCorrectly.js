const KYC_V2_COLLECTION = 'kyc_v2'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo }) => {

  const connection = mongo.connection
  const db = connection.db
  const kycCollection = db.collection(KYC_V2_COLLECTION)

  const session = connection.client.startSession()
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  try {
    await session.withTransaction(async () => {
      const badDocumentsCursor
        = await kycCollection.find({ dob: { $regex: /^\d{2}\/\d{2}\/\d{2}$/ } })

      while (await badDocumentsCursor.hasNext()) {
        // Update DD/MM/YY to DD/MM/YYYY
        const nextDocument = await badDocumentsCursor.next()

        const splitTimes = nextDocument.dob.split('/')
        const year = splitTimes.pop()

        if (year <= 5) {
          splitTimes.push('20' + year)
        } else {
          splitTimes.push('19' + year)
        }

        const newDOB = splitTimes.join('/')
        const updateFormat = { $set: { dob: newDOB } }

        const kycId = nextDocument._id
        await kycCollection.updateOne({ _id: kycId }, updateFormat)
      }
    })
  } finally {
    await session.endSession()
  }
}

// Not really a great option for reverting this change since there is no current way to track which documents
// have been altered. We could add an extra field as a signifier for these kyc documents, but not many options.
/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo }) => {
}
