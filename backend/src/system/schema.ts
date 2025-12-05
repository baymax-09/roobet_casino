import { config } from './config'
import { scopedLogger } from './logger'
import { r } from './rethink'
import { mongoose, megaloMongo } from './mongo'
import {
  runRoobetMongoDataMigrationUp,
  runMegaloMongoDataMigrationUp,
  runRethinkDataMigrationUp,
} from './dataMigrations'

import { type MongoConnections } from './mongo'
import { type DBCollectionSchema } from '../modules'
import { type SiteSettings } from 'src/modules/siteSettings/documents/settings'

const migrateLogger = scopedLogger('migrate')

async function seedData() {
  const [settings] = await r
    .table<SiteSettings>('settings')
    .getAll('main')
    .run()
  if (!settings) {
    await r.table('settings').insert(config.defaultSettings).run()
  }
}

export function getSchemas(): DBCollectionSchema[] {
  const schemas = require('../modules').loadSchemas()
  return schemas
}

const rethinkMigrationsSchema: DBCollectionSchema = {
  name: 'migrations',
  db: 'rethink',
}

export async function migrate(
  dbConnections: MongoConnections,
  options?: { data?: boolean; indexes?: boolean; force?: boolean },
) {
  const logger = migrateLogger('migrate', { userId: null })
  const { data = true, indexes = true, force = false } = options ?? {}

  if (config.worker !== 'migrate' && !force) {
    logger.debug('Skipping migrate.')
    return
  }

  logger.info('Migrating', { mode: config.mode })

  try {
    await r.dbCreate(config.rethinkdb.db)
  } catch (error) {
    if (
      !error.message.includes('ReqlOpFailedError: Database') &&
      !error.message.includes('already exists in:')
    ) {
      logger.error(
        'Error creating RethinkDB db',
        { db: config.rethinkdb.db },
        error,
      )
    }
  }

  // Create collections/indexes.
  if (indexes) {
    const schemas = [...getSchemas(), rethinkMigrationsSchema]

    await Promise.allSettled(
      schemas.map(async schema => {
        if (schema.db === 'rethink') {
          await migrateTableRethink(schema)
        } else if (schema.db === 'mongo') {
          await migrateTableMongo(schema)
        } else if (schema.db === 'megalomongo') {
          await migrateTableMegaloMongo(schema)
        }
      }),
    )

    logger.info('Created indexes.')
  }

  if (data) {
    const rethinkConnection = await r.connect({ host: config.rethinkdb.host })

    // Run any data migrations
    await Promise.all([
      runRoobetMongoDataMigrationUp(dbConnections.roobetMongoConn),
      runMegaloMongoDataMigrationUp(dbConnections.megaloMongoConn),
      runRethinkDataMigrationUp(
        r,
        rethinkConnection,
        config.rethinkdb.db,
        dbConnections.roobetMongoConn,
        dbConnections.megaloMongoConn,
      ),
    ])

    logger.info('Migrated data.')
  }

  await seedData()

  logger.info('Done initializing database.')
}

async function migrateTableMongo(table: DBCollectionSchema) {
  try {
    const model = mongoose.model(table.name)
    await model.createIndexes()
  } catch (error) {
    migrateLogger('migrateTableMongo', { userId: null }).error(
      'Error creating Mongo table',
      { table: table.name },
      error,
    )
  }
}

async function migrateTableMegaloMongo(table: DBCollectionSchema) {
  try {
    const model = megaloMongo.model(table.name)
    await model.createIndexes()
  } catch (error) {
    migrateLogger('migrateTableMongo', { userId: null }).error(
      'Error creating MegaloMongo table',
      { table: table.name },
      error,
    )
  }
}

async function migrateTableRethink(table: DBCollectionSchema) {
  const logger = migrateLogger('migrateTableRethink', { userId: null })
  try {
    const shardConfig = {
      shards: config.rethinkdb.shardsPerTable,
      replicas: config.rethinkdb.shardsPerTable,
    }
    try {
      const { shards } = await r.table(table.name).config()
      if (shards.length < shardConfig.shards) {
        logger.info('reconfiguring number of shards', {
          table: table.name,
          current: shards.length,
          incoming: shardConfig.shards,
        })
        await r.table(table.name).reconfigure(shardConfig)
      }
    } catch (error) {
      logger.error('Creating RethinkDB table', { table: table.name }, error)
      try {
        await r.tableCreate(table.name, shardConfig)
      } catch (error) {
        logger.error(
          'Error creating RethinkDB table',
          { name: table.name },
          error,
        )
      }
    }
  } catch (error) {
    logger.error('RethinkDB sharding error', {}, error)
  }

  if (table.indices) {
    for (const index of table.indices) {
      try {
        await r.table(table.name).indexCreate(index.name, index.cols).run()
      } catch (error) {
        if (
          !error.message.includes('ReqlOpFailedError: Index') &&
          !error.message.includes('already exists on table')
        ) {
          logger.error(
            'Error creating RethinkDB index',
            { table: table.name, index: index.name },
            error,
          )
        }
      }
    }
  }
}
