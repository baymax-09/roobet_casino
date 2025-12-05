/** @type string[] */
const userABACProps = [
  'admin',
  'superAdmin',
  'marketing',
  'marketingBonus',
  'officer',
  'mod',
  'kycReviewer',
  'fraudOfficer',
];

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users');

  const cursor = await User.run(rethinkConnection, { cursor: true });

  cursor.each(async (error, row) => {
    if (error) {
      throw error;
    }
    if (userABACProps.some((prop) => row[prop] !== undefined)) {
      await User.get(row.id).replace(r.row.without(...userABACProps)).run(rethinkConnection);
    }
  });
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async ({ context: { r, rethinkConnection, db } }) => {
  const User = r.db(db).table('users');

  const cursor = await User.run(rethinkConnection, { cursor: true });

  cursor.each(async (error, row) => {
    if (error) {
      throw error;
    }
    const baseAbacProps = userABACProps.reduce((p, c) => ({ ...p, [c]: false }), {});
    await User.get(row.id).update(baseAbacProps).run(rethinkConnection);
  });
};
