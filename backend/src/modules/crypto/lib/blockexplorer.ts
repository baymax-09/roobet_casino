import axios from 'axios'

import { config } from 'src/system'

import { type BlockioCryptoProperName } from '../types'
import { cryptoLogger } from './logger'

interface RawBlock {
  hash: string
  height: number
  chain: string
  total: number
  fees: number
  size: number
  vsize: number
  ver: number
  time: string
  received_time: string
  /** IP Address */
  relayed_by: string
  bits: number
  nonce: number
  n_tx: number
  prev_block: string
  mrkl_root: string
  txids: string[]
  depth: number
  prev_block_url: string
  tx_url: string
  next_txids: string
}

interface BlockchainInfo {
  name: string
  height: number
  hash: string
  time: Date
  // example latest_url ""https://api.blockcypher.com/v1/btc/main/blocks/000000000000000000bf56ff4a81e399374a68344a64d6681039412de78366b8""
  latest_url: string
  previous_hash: string
  previous_url: string
  peer_count: number
  unconfirmed_count: number
  high_fee_per_kb: number
  medium_fee_per_kb: number
  low_fee_per_kb: number
  last_fork_height: number
  last_fork_hash: string
}

const api = axios.create({
  baseURL: 'https://api.blockcypher.com/v1',
  params: {
    token: config.blockcypher.token,
  },
})

const CryptoMap = {
  Bitcoin: 'btc',
  Litecoin: 'ltc',
  Dogecoin: 'doge',
} as const

export async function getGeneralBlockchainInfo(
  crypto: BlockioCryptoProperName,
): Promise<BlockchainInfo | null> {
  try {
    const response = await api.get(`/${CryptoMap[crypto]}/main`)
    return response?.data
  } catch (error) {
    cryptoLogger('getGeneralBlockchainInfo', { userId: null }).error(
      `blockcypher API Error - ${error.message}`,
      { crypto },
      error,
    )
    // FIXME: are we throwing here for a reason? can we just return false or something?
    throw error
  }
}

export async function getBlockByBlockHash(
  crypto: BlockioCryptoProperName,
  blockhash: string,
): Promise<RawBlock> {
  try {
    const response = await api.get(
      `/${CryptoMap[crypto]}/main/blocks/${blockhash}`,
    )
    return response.data
  } catch (error) {
    cryptoLogger('getBlockByBlockHash', { userId: null }).error(
      `blockcypher API Error - ${error.message}`,
      { crypto },
      error,
    )
    // FIXME: are we throwing here for a reason? can we just return false or something?
    throw error
  }
}
