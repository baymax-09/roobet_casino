/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['locale'] === 'rs') {
      await User.get(row.id).update({'locale': 'sr'}).run(rethinkConnection)
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
    if (row['locale'] === 'sr') {
      await User.get(row.id).update({'locale': 'rs'}).run(rethinkConnection)
    }
  })
}
