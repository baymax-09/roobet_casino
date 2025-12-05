/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['locale'] === 'cn') {
      await User.get(row.id).update({'locale': 'zh'}).run(rethinkConnection)
    }
    if (row['locale'] === 'ir') {
      await User.get(row.id).update({'locale': 'fa'}).run(rethinkConnection)
    }
    if (row['locale'] === 'cz') {
      await User.get(row.id).update({'locale': 'cs'}).run(rethinkConnection)
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
    if (row['locale'] === 'zh') {
      await User.get(row.id).update({'locale': 'cn'}).run(rethinkConnection)
    }
    if (row['locale'] === 'fa') {
      await User.get(row.id).update({'locale': 'ir'}).run(rethinkConnection)
    }
    if (row['locale'] === 'cs') {
      await User.get(row.id).update({'locale': 'cz'}).run(rethinkConnection)
    }
  })
}