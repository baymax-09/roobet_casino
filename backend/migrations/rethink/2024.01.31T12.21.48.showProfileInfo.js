/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const UserSettings = r.db(db).table('user_system_settings')
  
  const cursor = await UserSettings.run(rethinkConnection, { cursor: true })
  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row) {
    await UserSettings.get(row.id).replace(user =>
      user
        .merge({
          profile: {
            editable: user('profile')('editable')
              .default({})
              .merge({
                showProfileInfo: r.and(
                  user('profile')('editable')('showBets').default(true),
                  user('profile')('editable')('showTotalBet').default(true),
                ),
              }),
          },
        })
        .without({
          profile: { editable: { showBets: true, showTotalBet: true } },
        }),
      )
      .run(rethinkConnection)
      }
    })
}
/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const UserSettings = r.db(db).table('user_system_settings')
  
  const cursor = await UserSettings.run(rethinkConnection, { cursor: true })
  cursor.each(async (error, row) => {
    if (error) {
      throw error
    }
    if (row) {
      await UserSettings.get(row.id).replace(user =>
        user
          .merge({
            profile: {
              editable: user('profile')('editable')
                .default({})
                .merge({
                  showBets: r.and(
                    user('profile')('editable')('showProfileInfo').default(true),
                  ),
                  showTotalBet: r.and(
                    user('profile')('editable')('showProfileInfo').default(true),
                  ),
                }),
            },
          })
          .without({
            profile: { editable: { showProfileInfo: true } },
          }),
        )
        .run(rethinkConnection)
        }
      })
    }
      