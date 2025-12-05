import { type BlockioNewBlock } from 'block_io'

import { updatePendingTransactionsByTransactionHashes } from 'src/modules/crypto/documents/outgoing_transactions'

export const processNewBlock = async (data: BlockioNewBlock) => {
  const { block_no, block_hash, txs } = data
  const blockConfirmed = block_no
  await updatePendingTransactionsByTransactionHashes(txs, {
    status: 'completed',
    blockConfirmed,
    blockHash: block_hash,
  })
}
