import * as t from 'io-ts'
import type TronWeb from 'tronweb'

import { BlockInfoV } from 'src/types/tronweb/controls'
import { DepositError, type IOResult } from 'src/modules/crypto/types'
import { config } from 'src/system/config'
import { scopedLogger } from 'src/system/logger'

import { type BlockInfo, BlockInfosV } from '../../types'
import { trxRestApi } from '../api'

const ConfirmedBlockResponseType = t.type({
  block: BlockInfosV,
})

const tronLogger = scopedLogger('tron-lib-deposit-block')

/** fetches a list of blocks of size N, where N is the minConfirmations needed for a deposit
 * THEN sorts those block heights and returns the first block AKA the only confirmed block in the list
 */
export async function getLatestConfirmedBlock(): Promise<
  IOResult<BlockInfo, Error>
> {
  const { minConfirmations } = config.tron.deposit
  const blocks = await trxRestApi(
    'getblockbylatestnum',
    {
      num: minConfirmations,
    },
    ConfirmedBlockResponseType,
  )

  if (!blocks.success) {
    return blocks
  }

  const sortedBlocks = blocks.result.block
    .filter(block => !!block.block_header.raw_data.number)
    .sort(
      (h1, h2) =>
        h1.block_header.raw_data.number! - h2.block_header.raw_data.number!,
    )

  if (sortedBlocks.length !== minConfirmations) {
    return {
      success: false,
      error: new Error('Some blocks did not contain enough data'),
      result: undefined,
    }
  }

  return {
    success: true,
    error: undefined,
    result: sortedBlocks[0],
  }
}

export async function getBlockData(
  tronWeb: TronWeb,
  blockHeightRaw: string,
): Promise<IOResult<BlockInfo, DepositError>> {
  const logger = tronLogger('getBlockData', { userId: null })

  const blockHeight = parseInt(blockHeightRaw)
  if (isNaN(blockHeight)) {
    return {
      success: false,
      error: new DepositError('Block height is NaN'),
      result: undefined,
    }
  }

  const blockInfoTime = Date.now()

  const blockInfo = await tronWeb.trx.getBlockByNumber(blockHeight)

  const ioIsTime = Date.now()

  if (!BlockInfoV.is(blockInfo)) {
    return {
      success: false,
      error: new DepositError('Block Info return type is not expected'),
      result: undefined,
    }
  }

  logger.info('getBlockData', {
    lookupTime: Date.now() - blockInfoTime,
    parseTime: Date.now() - ioIsTime,
  })

  return {
    success: true,
    error: undefined,
    result: blockInfo,
  }
}
