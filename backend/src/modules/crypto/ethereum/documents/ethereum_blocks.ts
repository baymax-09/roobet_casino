import moment from 'moment'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

export interface EthereumBlock {
  height: number
  hash: string
  processed: boolean
  processedInternal: boolean
  createdAt: Date
}

const EthereumBlockSchema = new mongoose.Schema<EthereumBlock>(
  {
    height: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
      unique: true,
    },
    hash: String,
    processed: {
      type: Boolean,
      index: true,
    },
    processedInternal: {
      type: Boolean,
      index: true,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30,
    },
  },
  { timestamps: true },
)

const EthereumBlockModel = mongoose.model<EthereumBlock>(
  'ethereum_blocks',
  EthereumBlockSchema,
)

/**
 * @todo BD if we don't sort then the returned order is indeterminate, sort it by height ascending order.
 * @param staleTimeMinutes we do this to give Etherscan some time to be up-to-date(ironic)
 */
export async function getInternalUnprocessedBlocks(
  staleTimeMinutes = 1,
): Promise<EthereumBlock[]> {
  const endDate = moment().subtract(staleTimeMinutes, 'minutes').toISOString()
  return await EthereumBlockModel.aggregate([
    { $match: { processedInternal: { $exists: true, $eq: false } } },
    { $match: { createdAt: { $lte: new Date(endDate) } } },
  ])
}

async function grabFirstOrLastBlock(
  order: 1 | -1,
  skipCount = 0,
): Promise<EthereumBlock | undefined> {
  const [block] = await EthereumBlockModel.find({})
    .sort({ height: order })
    .limit(1)
    .skip(skipCount)
    .lean()

  return block
}

export async function getLastEthereumBlock(): Promise<
  EthereumBlock | undefined
> {
  return await grabFirstOrLastBlock(-1)
}

export async function getOldEthereumBlock(
  skipCount: number,
): Promise<EthereumBlock | undefined> {
  const skip = skipCount < 0 ? 1 : skipCount
  const result = await grabFirstOrLastBlock(-1, skip)
  if (!result) {
    return await grabFirstOrLastBlock(-1, 1)
  }
  return result
}

/**
 * Get the oldest, unprocessed Ethereum block that our shallow copy is aware of.
 */
export async function getOldestUnProcessedBlock(): Promise<
  EthereumBlock | undefined
> {
  const [unprocessedBlock] = await EthereumBlockModel.find({ processed: false })
    .sort({ height: 1 })
    .limit(1)
    .lean()
  return unprocessedBlock
}

/**
 * Get the latest block that we have processed regular/ERC20 transactions for.
 */
export async function getLatestProcessedBlock(): Promise<
  EthereumBlock | undefined
> {
  const [processedBlock] = await EthereumBlockModel.find({ processed: true })
    .sort({ height: -1 })
    .limit(1)
    .lean()
  return processedBlock
}

/**
 * Get the latest block that we have processed smart contract transactions for.
 */
export async function getLatestProcessedInternalBlock(): Promise<
  EthereumBlock | undefined
> {
  const [processedBlock] = await EthereumBlockModel.find({
    processedInternal: true,
  })
    .sort({ height: -1 })
    .limit(1)
    .lean()
  return processedBlock
}

export async function markBlockAsProcessed(blockId: number): Promise<void> {
  await EthereumBlockModel.updateOne({ height: blockId }, { processed: true })
}

export async function markBlockAsProcessedInternal(
  blockId: number,
): Promise<void> {
  await EthereumBlockModel.updateOne(
    { height: blockId },
    { processedInternal: true },
  )
}

export async function markBlockAsUnProcessed(blockId: number): Promise<void> {
  await EthereumBlockModel.updateOne(
    { height: blockId },
    { processed: false, processedInternal: false },
  )
}

export async function getTotalBlockCount(): Promise<number> {
  return await EthereumBlockModel.countDocuments({}).exec()
}

export async function getEthereumBlock(
  blockId: number,
): Promise<EthereumBlock | null> {
  return await EthereumBlockModel.findOne({ height: blockId }).lean()
}

export async function createEthereumBlock(
  blockNumber: number,
  blockHash: string,
): Promise<void> {
  const toInsert = {
    height: blockNumber,
    hash: blockHash,
    processed: false,
  }

  await EthereumBlockModel.create(toInsert)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: EthereumBlockModel.collection.name,
}
