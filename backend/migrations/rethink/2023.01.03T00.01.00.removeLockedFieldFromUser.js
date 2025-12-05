/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  try {
    await User.indexCreate('locked').run(rethinkConnection)
    await User.indexWait('locked').run(rethinkConnection)
  } catch(e){ /** Index already created */}

  const cursor = await User
    .getAll(true, { index: "locked" }).union(User.getAll(false, { index: "locked" }))
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    await User.get(row.id).replace(r.row.without('locked')).run(rethinkConnection)
  })

  User.indexDrop('locked')
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  try {
    await User.indexCreate('lockedUntil').run(rethinkConnection)
  } catch(e){ /** Index already created */}

  const cursor = await User
    .getAll(r.args(r.row('lockedUntil').eq('2070-01-01T01:00:00.000Z')), { index: 'lockedUntil' })
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    await User.get(row.id).update({ locked: true }).run(rethinkConnection)
  })
}
