import aguid from 'aguid'

/**
 * Creates a unique record ID by concatenating each string in a list and then producing a SHA256 hash.
 */
export function createUniqueID(
  list: ReadonlyArray<string | number | undefined>,
) {
  return aguid(list.join(''))
}
