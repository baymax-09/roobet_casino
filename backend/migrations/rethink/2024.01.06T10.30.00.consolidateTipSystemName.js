/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const UserSettings = r.db(db).table('user_system_settings');

  const cursor = await UserSettings.run(rethinkConnection, { cursor: true });

  cursor.each(async (error, row) => {
    if (error) {
      throw error;
    }
    if (row.tips?.enabled === false) {
      await UserSettings.get(row.id).replace(r.row.merge({ tip: { enabled: false } }).without('tips')).run(rethinkConnection);
    } else {
      await UserSettings.get(row.id).replace(r.row.without('tips')).run(rethinkConnection);
    }
  });
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
};
