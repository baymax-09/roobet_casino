import axios from 'axios'

import { config } from 'src/system'
import { getUserById } from 'src/modules/user'
import { lockDownUser } from 'src/modules/withdraw/lib/risk'
import { slackRiskAlert } from 'src/vendors/slack'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import {
  type CryptoLowercase,
  type CryptoSymbol,
} from 'src/modules/crypto/types'

import { SymbolToNetworkMap, TransferMap, isAssetType } from '../types/enums'
import { chainalysisLogger } from './logger'

const api = axios.create({
  baseURL: 'https://api.chainalysis.com/api/kyt/v1',
  headers: {
    Token: config.chainalysis.token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/*
 * Withdrawals:
 * - Terrorism
 *     - Disable Withdrawals
 *     - Send alert to slack
 * - Child Abuse
 *     - Disable Withdrawals
 *     - Send alert to slack
 * - Dark Net & Scam
 *     - Send alert to slack
 *     - Don’t block the user, just don’t accept the withdrawal - retry with another address
 */

/*
 * Deposits:
 * - Terrorism
 *     - Disable Withdrawals
 *     - Send alert to slack
 * - Child Abuse
 *     - Disable Withdrawals
 *     - Send alert to slack
 */

const HIGHEST_RISK = {
  'terrorist financing': true,
  'child abuse material': true,
  'stolen funds': true,
  'stolen bitcoins': true,
  'stolen ether': true,
  mixing: true,
  'fraud shop': true,
  'darknet market': true,
  sanctions: true,
  ransomware: true,
  'illicit actor-org': true,
} as const
const HIGH_RISK = {
  scam: true,
} as const

interface highRiskResponse {
  analysis: any
  isHighRisk: boolean
}

const isHighestRisk = (value: any): value is keyof typeof HIGHEST_RISK =>
  Object.keys(HIGHEST_RISK).includes(value)
const isHighRisk = (value: any): value is keyof typeof HIGH_RISK =>
  Object.keys(HIGH_RISK).includes(value)

export const recordReceivedTransfer = async (
  userId: string,
  transactionId: string,
  address: string,
  crypto: CryptoLowercase,
): Promise<highRiskResponse | undefined> => {
  const { network, asset } = TransferMap[crypto]
  const transferReference = `${transactionId}:${address}`
  const logger = chainalysisLogger('recordReceivedTransfer', { userId }).info(
    `recording ${asset}, ${transferReference}`,
    { asset, transferReference },
  )
  try {
    // TODO add type annotation to api.post<>
    const response = await api.post(`/users/${userId}/transfers/received`, [
      {
        network,
        asset,
        transferReference,
      },
    ])

    if (!response || !response.data[0]) {
      return
    }

    const [analysis] = response.data
    const category = analysis?.cluster?.category

    const user = await getUserById(userId)
    if (!user) {
      return
    }

    if (isHighRisk(category) && HIGH_RISK[category]) {
      // basically do nothing, natalie can handle this inside KYT.
    }
    if (isHighestRisk(category) && HIGHEST_RISK[category]) {
      await lockDownUser(userId, true)
      slackRiskAlert(
        `*${user.name}* [${user.id}] made a risky *deposit*` +
          '\n*Action Taken*: Withdrawals/Tips/Bets Disabled' +
          `\n*Category*: ${analysis.cluster.category}` +
          `\n*Txid*: ${transactionId}` +
          `\n*From Address*: ${address}`,
      )
      await addNoteToUser(
        userId,
        { id: 'chainalysis', name: 'chainalysis', department: 'Compliance' },
        'Risky deposit detected. Withdrawals/Tips/Bets disabled.',
      )
      // highRisk field used to determine if we should fail the transaction
      const updatedAnalyis = {
        analysis,
        isHighRisk: true,
      }
      return updatedAnalyis
    }

    logger.info('analysis', { analysis })
    const updatedAnalyis = {
      analysis,
      isHighRisk: false,
    }
    return updatedAnalyis
  } catch (error) {
    logger.error('error', { address, crypto, transactionId }, error)
  }
}

export const withdrawPreScreen = async (
  userId: string,
  currency: CryptoSymbol,
  address?: string,
): Promise<{
  isHighRisk: boolean
  analysis?: Record<string, any>
  message?: string
}> => {
  const logger = chainalysisLogger('withdrawPreScreen', { userId })
  const network = SymbolToNetworkMap[currency]
  const asset = currency.toUpperCase()

  if (!isAssetType(asset)) {
    logger.info('withdrawPreScreen invalid asset provided', { asset, address })
    return {
      isHighRisk: false,
    }
  }

  logger.info('withdrawPreScreen starting', { asset, address })
  try {
    // TODO add type annotation to api.post<>
    const response = await api.post(`/users/${userId}/withdrawaladdresses`, [
      {
        network,
        asset,
        address,
      },
    ])

    if (!response || !response.data[0]) {
      return {
        isHighRisk: false,
      }
    }

    const [analysis] = response.data
    const category = analysis?.cluster?.category

    const user = await getUserById(userId)
    if (!user) {
      return {
        isHighRisk: false,
      }
    }

    if (isHighRisk(category) && HIGH_RISK[category]) {
      slackRiskAlert(
        `*${user.name}* [${user.id}] attempted a risky *withdrawal*` +
          '\n*Action Taken*: Asked to retry with different address' +
          `\n*Category*: ${analysis.cluster.category}` +
          `\n*To Address*: ${address}`,
      )
      await addNoteToUser(
        userId,
        { id: 'chainalysis', name: 'chainalysis', department: 'Compliance' },
        'Risky withdrawal attempted. Asked to retry with different address.',
      )

      return {
        analysis,
        isHighRisk: true,
        message: 'crypto__compliance_cant_send',
      }
    }

    if (isHighestRisk(category) && HIGHEST_RISK[category]) {
      await lockDownUser(userId)
      slackRiskAlert(
        `*${user.name}* [${user.id}] attempted a risky *withdrawal*` +
          '\n*Action Taken*: Told them the withdrawal failed, and to contact support' +
          `\n*Category*: ${analysis.cluster.category}` +
          `\n*To Address*: ${address}`,
      )
      await addNoteToUser(
        userId,
        { id: 'chainalysis', name: 'chainalysis', department: 'Compliance' },
        'Risky withdrawal attempted. Withdrawals/Tips disabled.',
      )

      return {
        analysis,
        isHighRisk: true,
        message: 'crypto__compliance_cant_send_high',
      }
    }

    logger.info('analysis', { analysis })
    return {
      analysis,
      isHighRisk: false,
    }
  } catch (error) {
    logger.error(
      'Chainalysis withdrawPreScreen err',
      { address, currency },
      error,
    )
    return {
      isHighRisk: false,
    }
  }
}

export const recordSentTransfer = (
  userId: string,
  transactionId: string,
  address: string,
  crypto: CryptoLowercase,
) => {
  const { network, asset } = TransferMap[crypto]
  const transferReference = `${transactionId}:${address}`
  const logger = chainalysisLogger('recordSentTransfer', { userId }).info(
    `record: ${asset}, ${transferReference}`,
    { asset, transferReference },
  )
  api
    .post(`/users/${userId}/transfers/sent`, [
      {
        network,
        asset,
        transferReference,
      },
    ])
    .then(function (response) {
      logger.info('response', { data: response.data })
    })
    .catch(function (error) {
      logger.error('error', {}, error)
    })
}
