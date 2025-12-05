import { Network, Alchemy } from 'alchemy-sdk'

import { config } from 'src/system'
import { cryptoLogger } from '../../lib/logger'

interface PolygonBlock {
  blockHash: string
  blockHeight: number
}

const { apiKey } = config.polygon
const settings = {
  apiKey,
  network: Network.MATIC_MAINNET,
}

export async function getLatestBlockNumber(): Promise<number> {
  const alchemy = new Alchemy(settings)

  try {
    return await alchemy.core.getBlockNumber()
  } catch (error) {
    cryptoLogger('polygon/getLatestBlockNumber', { userId: null }).error(
      'alchemy getLatestBlockNumber - failed to getLatestBlockNumber for Polygon',
      {},
      error,
    )
    throw new Error('failed to get latest Polygon block number')
  }
}

export async function getLatestBlock(): Promise<PolygonBlock | null> {
  const alchemy = new Alchemy(settings)

  try {
    const latestBlockNumber = await alchemy.core.getBlockNumber()
    const latestBlock = await alchemy.core.getBlock(latestBlockNumber)
    if (!latestBlock) {
      return null
    }

    return {
      blockHash: latestBlock.hash,
      blockHeight: latestBlock.number,
    }
  } catch (error) {
    cryptoLogger('polygon/getLatestBlock', { userId: null }).error(
      'alchemy getLatestBlock - failed to getLatestBlock for Polygon',
      {},
      error,
    )
    throw new Error('failed to get latest Polygon block')
  }
}

export async function getBlock(height: number): Promise<PolygonBlock | null> {
  const alchemy = new Alchemy(settings)
  try {
    const latestBlock = await alchemy.core.getBlock(height)
    if (!latestBlock) {
      return null
    }

    return {
      blockHash: latestBlock.hash,
      blockHeight: latestBlock.number,
    }
  } catch (error) {
    cryptoLogger('polygon/getBlock', { userId: null }).error(
      `alchemy getBlock - failed to getBlock for Polygon ${height}`,
      {},
      error,
    )
    throw new Error('failed to get Polygon block')
  }
}
