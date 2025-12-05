import { config } from 'src/system'

import { runOnInterval } from 'src/util/workerRunner'

import { shouldDebounce, setDebounce, sendSlackMessage } from './utils'
import { anomalyLogger } from './logger'
import {
  type ValidatedDataset,
  fetchValidatedDataset,
  fetchTables,
  fetchAllRows,
  fetchTableLabels,
  type ValidatedTable,
} from './bigquery'

const RUN_ON_LOCAL = false
const ALERTS_DATASET_ID = 'alerts'
const DEFAULT_QUERY_INTERVAL = 5

const monitorRows = async (table: ValidatedTable) => {
  const logger = anomalyLogger(`monitorRows ${table.id}`, { userId: null })

  const tableId = table.id
  const rows = await fetchAllRows(table)

  if (!rows.length) {
    logger.info('No rows to process.', {
      datasetId: table.dataset.id,
      tableId,
    })
  }

  for (const row of rows) {
    try {
      if (!row.message) {
        logger.error('Row missing message.', {
          datasetId: table.dataset.id,
          tableId,
          row,
        })
        continue
      }

      logger.info('Processing row', {
        datasetId: table.dataset.id,
        tableId,
        row,
      })

      const willDebounce = await shouldDebounce(row.message)

      if (willDebounce) {
        logger.info('Skipping anomaly, found debounce token in cache.', {
          row,
        })
        continue
      }

      // Send slack message.
      if (row.slack_alert_channel) {
        sendSlackMessage(row.message, row.slack_alert_channel)
      }

      // -- Add new actions here as necessary...

      // Finally, store debounce token in Redis for specified time.
      const debounceMinutes = parseInt(row.debounce_time ?? '0') || null

      if (debounceMinutes) {
        await setDebounce(row.message, debounceMinutes)
      }
    } catch (error) {
      logger.error('Failed to process row', {
        tableId,
        error,
        row,
      })
    }
  }
}

const monitorTables = async (alerts: ValidatedDataset) => {
  const logger = anomalyLogger(`monitorTables ${alerts.id}`, { userId: null })

  // Fetch all of tables, and their metadata.
  const tables = await fetchTables(alerts)

  for (const table of tables) {
    const tableId = table.id

    // Fetch and parse the labels for each table.
    const labels = await fetchTableLabels(table)

    // Determine interval in minutes, or fallback to default.
    const interval = parseInt(labels.interval ?? `0`) || DEFAULT_QUERY_INTERVAL

    logger.info('Starting interval for alerts table.', {
      interval,
      tableId,
    })

    // Run on interval in seconds.
    runOnInterval(interval * 60, () => monitorRows(table))
  }
}

export const startJob = async (): Promise<void> => {
  if (config.isProd || RUN_ON_LOCAL) {
    // Create bq instance for specified project.
    const alerts = await fetchValidatedDataset(ALERTS_DATASET_ID)

    // If the dataset is not found, log and exit process.
    if (!alerts) {
      process.exit(1)
    }

    await monitorTables(alerts)
  }
}
