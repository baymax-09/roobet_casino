import { type ChangeStreamDocument } from 'mongodb'
import { type Document, type Model } from 'mongoose'

import { scopedLogger } from 'src/system/logger'

const logger = scopedLogger('util/mongo')('mongoChangeFeedHandler', {
  userId: null,
})

export const mongoChangeFeedHandler = async <T>(
  mongooseModel: Model<any>,
  onDocumentChangeFunction: (
    // only these operationTypes have fullDocument
    document: ChangeStreamDocument<T & Document> & {
      operationType: 'replace' | 'insert' | 'update'
    },
  ) => Promise<void>,
) => {
  const watch = (attempts = 1) => {
    // Allow the feed to reconnect once, then fail the health check.
    if (attempts > 2) {
      global.DEPLOYMENT_UNAVAILABLE = {
        reason: `${mongooseModel.collection.name} change feed has failed to reconnect ${attempts} times`,
      }
    }

    try {
      mongooseModel
        .watch([], { fullDocument: 'updateLookup' })
        .on('change', async (document: ChangeStreamDocument<T & Document>) => {
          if (
            document.operationType === 'replace' ||
            document.operationType === 'insert' ||
            document.operationType === 'update'
          ) {
            onDocumentChangeFunction(document)
          }
        })
        .on('error', error => {
          logger.error('Mongo changeStream error: ', {}, error)
        })
        .on('close', () => {
          logger.info(
            `Mongo changeStream closed for model ${mongooseModel.collection.name}`,
          )
          watch(attempts + 1)
        })
        .on('end', () => {
          logger.info(
            `Mongo changeStream ended for model ${mongooseModel.collection.name}`,
          )
        })
    } catch (error) {
      logger.error('Mongo changeStream error: ', {}, error)
      watch(attempts + 1)
    }
  }

  watch()
}
