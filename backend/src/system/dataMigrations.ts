import path from 'path'

import { Umzug, MongoDBStorage, type UmzugStorage } from 'umzug'
import { winston } from './'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type MongooseClass = typeof import('mongoose')

class RethinkDBStorage implements UmzugStorage {
  collection: any

  constructor(r: any) {
    this.collection = r.table('migrations')
  }

  async logMigration({ name }: { name: string }) {
    await this.collection.insert({ id: name }).run()
  }

  async unlogMigration({ name }: { name: string }) {
    await this.collection.get(name).delete().run()
  }

  async executed(): Promise<string[]> {
    const migrations: Array<{ id: string }> = await this.collection
      .orderBy('id')
      .pluck('id')
      .run()
    return migrations.map(({ id }) => id)
  }
}

export const runRoobetMongoDataMigrationUp = async (
  mongooseInstance: MongooseClass,
) => {
  const umzug = new Umzug({
    migrations: {
      glob: [
        'migrations/mongo/*.js',
        { cwd: path.resolve(__dirname, '../..') },
      ],
    },
    context: mongooseInstance,
    storage: new MongoDBStorage(mongooseInstance),
    logger: winston,
  })
  return await umzug.up()
}

export const runMegaloMongoDataMigrationUp = async (
  mongooseInstance: MongooseClass,
) => {
  const umzug = new Umzug({
    migrations: {
      glob: [
        'migrations/megalo/*.js',
        { cwd: path.resolve(__dirname, '../..') },
      ],
    },
    context: mongooseInstance,
    storage: new MongoDBStorage(mongooseInstance),
    logger: winston,
  })
  return await umzug.up()
}

export const runRethinkDataMigrationUp = async (
  r: any,
  rethinkConnection: any,
  db: any,
  mongo: MongooseClass,
  megalo: MongooseClass,
) => {
  const umzug = new Umzug({
    migrations: { glob: 'migrations/rethink/*.js' },
    context: { r, rethinkConnection, db, mongo, megalo },
    storage: new RethinkDBStorage(r),
    logger: winston,
  })
  return await umzug.up()
}
