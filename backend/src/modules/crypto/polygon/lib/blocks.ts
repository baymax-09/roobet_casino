import { config } from 'src/system'
import { BasicCache } from 'src/util/redisModels'

import { PolygonBlocks } from '../documents'
import { getLatestBlockNumber, getBlock } from './api'

const { processName, keyName } = config.polygon.blocks

type Options = 'useAPI' | 'fallbackOnAPI'
type OptionsArg = Partial<Record<Options, boolean>>

// blocks are added to the Polygon chain every 2s
// pass in expiration time in seconds
export async function fetchLatestPolygonBlock(
  expires: number,
): Promise<number> {
  const cachedHeight: number = await BasicCache.get(processName, keyName)
  if (cachedHeight) {
    return typeof cachedHeight === 'number'
      ? cachedHeight
      : parseInt(cachedHeight)
  }

  const blockHeight = await getLatestBlockNumber()

  await BasicCache.set(processName, keyName, blockHeight, expires)

  return blockHeight
}

export async function fetchRecordedPolygonBlock(
  height: number,
  options?: OptionsArg,
): Promise<{ height: number; hash?: string } | null> {
  if (options?.useAPI) {
    const block = await getBlock(height)
    if (block) {
      return {
        height: block.blockHeight,
        hash: block.blockHash,
      }
    }
  } else {
    // attempt to lookup in our DB, fallback on the API request
    const blockDoc = await PolygonBlocks.getPolygonBlock(height)
    if (blockDoc) {
      return {
        height: blockDoc.height,
        hash: blockDoc.hash,
      }
    }

    if (!blockDoc && options?.fallbackOnAPI) {
      const block = await getBlock(height)
      if (block) {
        return {
          height: block.blockHeight,
          hash: block.blockHash,
        }
      }
    }
  }

  return null
}
