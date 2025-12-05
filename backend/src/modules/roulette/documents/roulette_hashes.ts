import { r } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface RouletteHash {
  id: string
  hash: string
  index: number
  previousHash: string
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const RouletteHashModel = r.table<RouletteHash>('roulette_hashes')

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'roulette_hashes',
  indices: [{ name: 'index' }, { name: 'hash' }],
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export default RouletteHashModel
