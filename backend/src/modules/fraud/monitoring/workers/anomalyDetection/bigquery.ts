import { BigQuery, type Table, type Dataset } from '@google-cloud/bigquery'

import { config } from 'src/system'
import { anomalyLogger } from './logger'

export type ValidatedDataset = Dataset & { id: string }

export type ValidatedTable = Table & { id: string }

interface TableLabels {
  // Custom label for specifying the lookup interval in minutes.
  interval?: string
}

type FetchResultsRow = Partial<{
  // Message to alert on, must be unique.
  message: string

  // Send message to specified slack channel.
  slack_alert_channel: string

  // How long to wait until re-alerting.
  debounce_time: string
}>

let _bq: BigQuery | undefined

const isValidDataset = (dataset: Dataset): dataset is ValidatedDataset => {
  return 'id' in dataset
}

export const isValidTable = (table: Table): table is ValidatedTable => {
  return 'id' in table
}

export const getBQInstance = () => {
  if (_bq) {
    return _bq
  }

  return (_bq = new BigQuery({
    projectId: config.bigquery.projectId,
    credentials: config.bigquery.credentials,
  }))
}

export const fetchValidatedDataset = async (
  id: string,
): Promise<ValidatedDataset | undefined> => {
  const logger = anomalyLogger('bigquery:fetchValidatedDataset', {
    userId: null,
  })

  const bq = getBQInstance()
  const dataset = await bq.dataset(id)

  // If the dataset is not found, log and exit process.
  if (!isValidDataset(dataset)) {
    logger.error('Failed to load dataset.', {
      datasetId: id,
      dataset,
    })

    return undefined
  }

  return dataset
}

export const fetchTables = async (
  dataset: ValidatedDataset,
): Promise<ValidatedTable[]> => {
  const [tables] = await dataset.getTables({
    autoPaginate: true,
  })

  return tables.filter(isValidTable)
}

export const fetchAllRows = async (
  table: Table,
): Promise<FetchResultsRow[]> => {
  const logger = anomalyLogger('fetchResults', { userId: null })

  const bq = getBQInstance()
  const target = `${bq.projectId}.${table.dataset.id}.${table.id}`
  const query = `select * from ${target} limit 1000`

  try {
    // Run the query as a job.
    const [job] = await bq.createQueryJob(query)

    // Wait for job to complete and get rows.
    const [rows] = await job.getQueryResults()

    return rows
  } catch (error) {
    logger.error('Query job failed', {
      error,
      projectId: bq.projectId,
      datasetId: table.dataset.id,
      tableId: table.id,
      query,
    })

    return []
  }
}

export const fetchTableLabels = async (table: Table): Promise<TableLabels> => {
  const [metadata] = await table.getMetadata()

  const labels: TableLabels =
    typeof metadata === 'object' && 'labels' in metadata ? metadata.labels : {}

  return labels
}
