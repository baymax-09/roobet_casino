/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['locale'] === 'ph') {
      await User.get(row.id).update({'locale': 'fil'}).run(rethinkConnection)
    }
  })
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {  
      throw error
    }
    if (row['locale'] === 'fil') {
      await User.get(row.id).update({'locale': 'ph'}).run(rethinkConnection)
    }
  })
}