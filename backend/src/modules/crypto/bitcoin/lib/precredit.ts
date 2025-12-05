import { type BlockioRawTransaction } from 'block_io'

import { cryptoLogger } from '../../lib/logger'
import { isGlobalSystemEnabled } from 'src/modules/siteSettings'
import { bitcoinBlockioApi } from 'src/vendors/blockio'

const BIP125 = parseInt('ffffffff', 16) - 1

export const checkTxEligiblePrecredit = async (txn: BlockioRawTransaction) => {
  const enabled = await isGlobalSystemEnabled('precredit')
  const logger = cryptoLogger('bitcoin/checkTxEligiblePrecredit', {
    userId: null,
  })
  if (!enabled) {
    logger.error('Precredit system disabled.', { txn })
    return false
  }

  try {
    bip125(txn)
    await inputsConfirmedAndFee(txn)
    return true
  } catch (err) {
    logger.error('Pre-Credit request rejected', { txn }, err)
    return false
  }
}

const bip125 = (txn: BlockioRawTransaction) => {
  const logger = cryptoLogger('bitcoin/bip125', { userId: null })
  logger.info('bip125AndTime', { txn })

  if (txn.inputs.some(({ sequence }) => sequence < BIP125)) {
    logger.info('This is bip125-replaceable', { txn })
    throw 'This is bip125-replaceable'
  }

  logger.info('Made past bip125-replaceable check', { txn })
}

const inputsConfirmedAndFee = async ({
  inputs,
  network_fee,
  txid,
}: BlockioRawTransaction) => {
  const logger = cryptoLogger('inputsConfirmedAndFee', { userId: null })
  for (const input of inputs) {
    const inputTxn: BlockioRawTransaction =
      await bitcoinBlockioApi.getTransaction(input.from_output.txid)

    logger.info('bitcoin/inputsConfirmedAndFee', { txid, inputTxn, input })

    if (inputTxn.confirmations == 0) {
      throw 'Inputs are not confirmed.'
    }
  }

  if (parseFloat(network_fee) < 0.00005) {
    throw 'Fee is too low - ' + network_fee
  }
  logger.info('txInputs & fee passed')
}
