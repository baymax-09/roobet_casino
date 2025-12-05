/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['locale'] === 'jp') {
      await User.get(row.id).update({'locale': 'ja'}).run(rethinkConnection)
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
    if (row['locale'] === 'ja') {
      await User.get(row.id).update({'locale': 'jp'}).run(rethinkConnection)
    }
  })
}