/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  try {
    await User.indexCreate('locked').run(rethinkConnection)
    await User.indexWait('locked').run(rethinkConnection)
  } catch(e){ /** Index already created */}

  const cursor = await User
    .getAll(true, { index: 'locked' })
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['locked'] && !row['lockedUntil']) {
      await User.get(row.id).update({ lockedUntil: '2070-01-01T01:00:00.000Z' }).run(rethinkConnection)
    }
  })
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  try {
    User.indexCreate('lockedUntil')
  } catch(e){ /** Index already created */}

  const cursor = await User
    .getAll('2070-01-01T01:00:00.000Z', { index: 'lockedUntil' })
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    await User.get(row.id).update({ lockedUntil: null },).run(rethinkConnection)
  })
}
