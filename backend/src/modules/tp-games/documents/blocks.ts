import { type FilterQuery } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type User } from 'src/modules/user/types'
import { isRoleAccessPermitted } from 'src/modules/rbac'

import { type TPGame } from './games'

export const TP_BLOCK_KEYS = ['providerInternal', 'category'] as const
type TPBlockKey = (typeof TP_BLOCK_KEYS)[number]

export interface TPBlock {
  key: TPBlockKey
  value: string
}

const TPBlocksSchema = new mongoose.Schema<TPBlock>(
  {
    key: { type: String, index: true, enum: TP_BLOCK_KEYS },
    value: { type: String, index: true },
  },
  { timestamps: true },
)

TPBlocksSchema.index({ key: 1, value: 1 }, { unique: true })

const TPBlocksModel = mongoose.model<TPBlock>('tp_blocks', TPBlocksSchema)

export async function blockTPGame(block: TPBlock) {
  await TPBlocksModel.create(block)
}

export async function getActiveBlocks(filter: FilterQuery<TPBlock> = {}) {
  const results = await TPBlocksModel.find(filter).lean()
  return results
}

export async function enableTPGame(id: string) {
  await TPBlocksModel.findByIdAndDelete(id)
}

export async function isDisabled(
  game: TPGame,
  user: User | undefined,
): Promise<boolean> {
  const hasTPGamesReadAccess = await isRoleAccessPermitted({
    user,
    requests: [{ action: 'read', resource: 'tpgames' }],
  })

  if (hasTPGamesReadAccess) {
    return false
  }
  // We need to check both, since games can be disabled at a provider level
  const games = [game]
  if (
    game.approvalStatus === 'approved' &&
    (await filterOutDisabled(games)).length !== 0
  ) {
    return false
  }
  return true
}

export async function getMatchDisabledAggregationStage() {
  const activeBlocks = await getActiveBlocks()
  if (!activeBlocks.length) {
    return { $match: {} }
  }

  const accumulator: Record<string, string[]> = {}
  // Group the blocks by key
  const blockedValuesByKey = activeBlocks.reduce((acc, curr) => {
    const { key, value } = curr
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(value)
    return acc
  }, accumulator)

  // Return the pipeline stage to match against these blocked games
  return {
    $match: {
      ...Object.entries(blockedValuesByKey).reduce((blocks, [key, value]) => {
        return {
          ...blocks,
          [key]: { $nin: value },
        }
      }, {}),
    },
  }
}

export async function filterOutDisabled(games: TPGame[]): Promise<TPGame[]> {
  const activeBlocks = await getActiveBlocks()
  const enabledGames = games.filter(game => {
    for (const block of activeBlocks) {
      if (!game || game[block.key] === block.value) {
        return false
      }
    }
    return true
  })
  return enabledGames
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TPBlocksModel.collection.name,
}
