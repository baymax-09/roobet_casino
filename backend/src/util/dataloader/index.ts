import type DataLoader from 'dataloader'

import { scopedLogger } from 'src/system/logger'

const loaderLogger = scopedLogger('dataloader')

const isType = <T>(record: T | null): record is T => {
  return record !== null
}

/**
 * Retrieves multiple records associated with the given ids using the provided DataLoader.
 * It filters out null records and logs any errors that occur during the process.
 * In case of an error, the promise will resolve to an empty array.
 *
 * @template K The type of the ids.
 * @template T The type of the records. Must be an object.
 * @param {K[]} ids The ids of the records to load.
 * @param {DataLoader<K, T | null>} loader The DataLoader to use for loading the records.
 * @returns {Promise<T[]>} A promise that resolves to an array of the loaded records.
 * If a record fails to load or is null, it will be excluded from the returned array.
 */
export async function loadManyToMany<K, T extends object>(
  ids: K[],
  loader: DataLoader<K, T | null>,
): Promise<T[]> {
  const logger = loaderLogger('loadManyToMany', { userId: null })
  const promises = ids.map(id => loader.load(id))
  const records: Array<T | null> = await Promise.all(promises).catch<T[]>(
    error => {
      logger.error(
        'Failed to load records',
        { ids, loaderName: loader.name },
        error,
      )
      return []
    },
  )

  return records.filter(isType)
}

/**
 * Retrieves multiple records associated with the given id using the provided DataLoader.
 * It filters out null records and logs any errors that occur during the process.
 * In case of an error, the promise will resolve to an empty array.
 *
 * @template K The type of the id.
 * @template T The type of the records. Must be an object.
 * @param {K} id The id of the records to load.
 * @param {DataLoader<K, T[] | null>} loader The DataLoader to use for loading the records.
 * @returns {Promise<T[]>} A promise that resolves to an array of the loaded records.
 * If a record fails to load or is null, it will be excluded from the returned array.
 */
export async function loadOneToMany<K, T extends object>(
  id: K,
  loader: DataLoader<K, T[] | null>,
): Promise<T[]> {
  const logger = loaderLogger('loadOneToMany', { userId: null })
  const records: T[] | null = await loader.load(id).catch<T[]>(error => {
    logger.error(
      'Failed to load records',
      { id, loaderName: loader.name },
      error,
    )
    return []
  })

  return records ? records.filter(isType) : []
}
