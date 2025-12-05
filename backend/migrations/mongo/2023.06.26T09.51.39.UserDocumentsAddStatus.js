const DOCUMENT_COLLECTION = 'user_documents'

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: mongo}) => {
    const connection = mongo.connection
    const db = connection.db
    await db.collection(DOCUMENT_COLLECTION).updateMany({}, 
        [
            { 
                $set: { 
                    status: { 
                        $switch: {
                            branches: [
                                { case: { $eq: [ "$approved", true ] }, then: "approved" },
                                { case: { $eq: [ "$rejected", true ] }, then: "rejected" },
                              ],
                            default: "in_review",
                        },
                    }, 
                },
            },
            {
                $unset: ['approved', 'rejected'],
            },
        ],
    )
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: mongo}) => { 
    const connection = mongo.connection
    const db = connection.db
    await db.collection(DOCUMENT_COLLECTION).updateMany({
        status: { $exists: true, $eq: 'approved' },
    }, { 
        $set: {
            approved: true,
            rejected: false,
        },
        $unset: { status: '' },
    })
    await db.collection(DOCUMENT_COLLECTION).updateMany({
        status: { $exists: true, $eq: 'rejected' },
    }, { 
        $set: {
            approved: false,
            rejected: true,
        },
        $unset: { status: '' },
    })
    await db.collection(DOCUMENT_COLLECTION).updateMany({
        status: { $exists: true },
    }, { 
        $set: {
            approved: false,
            rejected: false,
        },
        $unset: { status: '' },
    })
};
