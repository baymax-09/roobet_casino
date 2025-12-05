/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const Users = r.db(db).table('users')
  const ABACUsers = r.db(db).table('users')
    .filter(
      r.row('admin').eq(true)
      .or(r.row('superAdmin').eq(true))
      .or(r.row('marketing').eq(true))
      .or(r.row('marketingBonus').eq(true))
      .or(r.row('officer').eq(true))
      .or(r.row('mod').eq(true))
      .or(r.row('kycReviewer').eq(true))
      .or(r.row('fraudOfficer').eq(true))
    )

  const cursor = await ABACUsers
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    await Users.get(row.id).update({staff: true}).run(rethinkConnection)
  })
}

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const Users = r.db(db).table('users')
  const ABACUsers = r.db(db).table('users')
    .filter(
      r.row('staff').eq(true)
    )

  const cursor = await ABACUsers
    .run(rethinkConnection, { cursor: true })

  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    await Users.get(row.id).replace(r.row.without('staff')).run(rethinkConnection)
  })
}
