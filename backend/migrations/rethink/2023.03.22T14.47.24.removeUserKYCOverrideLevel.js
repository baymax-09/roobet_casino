/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users')

  const cursor = await User
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row['userKYCOverrideLevel'] !== undefined) {
      await User.get(row.id).replace(r.row.without('userKYCOverrideLevel')).run(rethinkConnection)
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
    await User.get(row.id).update({ userKYCOverrideLevel: row['kycRequiredLevel'] }).run(rethinkConnection)
  })
}
