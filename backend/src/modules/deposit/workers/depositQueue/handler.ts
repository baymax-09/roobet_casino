import { type CryptoNetwork } from 'src/modules/crypto/types'

import { updateDepositTransaction } from '../../documents/deposit_transactions_mongo'
import {
  CryptoDepositHooks,
  GenericDepositQueueHooks,
} from '../../hooks/depositQueue'
import { requiredConfirmations } from '../../lib/util'
import {
  type DepositQueuePayload,
  type DepositQueueMessage,
  isSupportedNetwork,
} from '../../types'

const processDepositPayload = async <T>(
  network: CryptoNetwork,
  depositPayload: DepositQueuePayload,
  transaction: T,
) => {
  if (!isSupportedNetwork(network)) {
    return
  }

  const { checkConfirmations, postCryptoHooks } = CryptoDepositHooks[network]
  const {
    validationChecks,
    startDeposit,
    riskCheck,
    completeDeposit,
    postProcessingHooks,
    onError,
  } = GenericDepositQueueHooks
  const minConfirmations = requiredConfirmations[depositPayload.depositType]

  try {
    const shouldProcessDeposit = await validationChecks(depositPayload)
    if (!shouldProcessDeposit) {
      return
    }

    const depositId = await startDeposit(depositPayload, network)
    if (!depositId) {
      return
    }

    const confirmations = await checkConfirmations(depositPayload, transaction)
    await updateDepositTransaction({
      _id: depositId,
      status: 'pending',
      confirmations,
    })
    if (confirmations < minConfirmations) {
      return
    }

    const updatedDepositPayload = {
      ...depositPayload,
      confirmations,
      depositMongoId: depositId,
    }

    const shouldCreditDeposit = await riskCheck(updatedDepositPayload)
    if (!shouldCreditDeposit) {
      return
    }

    await completeDeposit(updatedDepositPayload)

    await postCryptoHooks(updatedDepositPayload)
    await postProcessingHooks(updatedDepositPayload)
  } catch (error) {
    await onError({ depositPayload, error })
  }
}

export const handler = async (message: DepositQueueMessage) => {
  for (const deposit of message.deposits) {
    await processDepositPayload<typeof deposit.transaction>(
      message.network,
      deposit.deposit,
      deposit.transaction,
    )
  }
}
