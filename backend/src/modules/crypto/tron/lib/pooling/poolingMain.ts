import { scopedLogger } from 'src/system/logger'
import { BasicCache } from 'src/util/redisModels'
import { config } from 'src/system'
import { getCurrencyPair } from 'src/modules/currency'
import {
  estimateTronBandwidth,
  estimateTronEnergy,
} from 'src/modules/crypto/tron/lib'

import { getTrxBalance, getTRC20Balance } from '../wallet'
import {
  isTRC20Token,
  isTronToken,
  type TronAddressBase58,
  type TronToken,
} from '../../types'
import {
  getBalanceByTRC20TokenAndActionRequired,
  resetProcessingStatus,
} from '../../documents/tron_balances'
import {
  PoolingError,
  type PoolingWorkerHooks,
  type PoolingTokensReturn,
  type CryptoNetwork,
} from '../../../types'
import { getProvider } from '../../util/getProvider'
import { getTrxPoolingThreshold, poolTRX, shouldPoolTrx } from './poolingTRX'
import { getTRC20PoolingThreshold, poolTRC20 } from './poolingTRC20'

type ShouldPoolWalletResult =
  | {
      shouldPool: boolean
      shouldDeleteBalanceDoc: false
      balance: number
    }
  | {
      shouldPool: false
      shouldDeleteBalanceDoc: boolean
      balance: undefined
    }
interface FreeResources {
  freeBandwidth: number
  freeEnergy: number
}

export const tronPoolingLogger = scopedLogger('tronPooling')

async function getPoolingThreshold(token: TronToken) {
  if (isTRC20Token(token)) {
    return await getTRC20PoolingThreshold(token)
  } else {
    return await getTrxPoolingThreshold()
  }
}

export const getFreeResources = async (
  address: TronAddressBase58,
): Promise<FreeResources> => {
  try {
    const tronWeb = getProvider()
    const account = await tronWeb.trx.getAccountResources(address)
    const freeNetUsed = account.freeNetUsed ?? 0
    const freeNetLimit = account.freeNetLimit ?? 0
    const freeBandwidth = freeNetLimit - freeNetUsed
    const energyLimit = account.EnergyLimit ?? 0
    const energyUsed = account.EnergyUsed ?? 0
    const freeEnergy = energyLimit - energyUsed

    return { freeBandwidth, freeEnergy }
  } catch (error) {
    const logger = tronPoolingLogger('getFreeResources', {
      userId: null,
    })
    const message = `fail to get the free bandwidth and energy of an account`
    logger.error(message)
    throw new Error(message)
  }
}

export const shouldPoolWallet = async (
  address: TronAddressBase58,
  walletIndex: number,
  token: TronToken,
): Promise<ShouldPoolWalletResult> => {
  const { usd: feeInUSD } = await getPoolingThreshold(token)
  if (token === 'trx') {
    const { bandwidth: estimatedBandwidth } = await estimateTronBandwidth()
    const higherPriorityBalances =
      await getBalanceByTRC20TokenAndActionRequired(address, 'approve')
    if (higherPriorityBalances.length) {
      return {
        shouldPool: false,
        shouldDeleteBalanceDoc: false,
        balance: undefined,
      }
    }

    const { usd } = await getTrxBalance(address)
    const isBalanceZero = usd !== undefined && usd <= 0
    const shouldPool = usd >= feeInUSD
    if (isBalanceZero) {
      return {
        shouldPool: false,
        shouldDeleteBalanceDoc: true,
        balance: undefined,
      }
    } else if (!shouldPool) {
      const { freeBandwidth } = await getFreeResources(address)
      return {
        shouldPool: freeBandwidth > estimatedBandwidth,
        shouldDeleteBalanceDoc: false,
        balance: usd,
      }
    } else {
      return {
        shouldPool: true,
        shouldDeleteBalanceDoc: false,
        balance: usd,
      }
    }
  } else {
    const pair = await getCurrencyPair(token, 'usd')
    const { energy: estimatedEnergy } = await estimateTronEnergy(token)
    // this should never happen, so we throw to stop any process using this Fn
    if (!pair || !pair.exchangeRate) {
      const logger = tronPoolingLogger('shouldPoolWallet', { userId: null })
      const message = 'missing exchange rate for ' + token
      logger.error(message, { token })
      throw new Error(message)
    }

    const balance = await getTRC20Balance(address, walletIndex, token)
    const balanceInUSD = balance * pair.exchangeRate
    const isBalanceZero = balanceInUSD !== undefined && balanceInUSD <= 0
    const shouldPool = balanceInUSD > feeInUSD
    if (isBalanceZero) {
      return {
        shouldPool: false,
        shouldDeleteBalanceDoc: true,
        balance: undefined,
      }
    } else if (!shouldPool) {
      const { freeEnergy } = await getFreeResources(address)
      return {
        shouldPool: freeEnergy > estimatedEnergy,
        shouldDeleteBalanceDoc: false,
        balance: balanceInUSD,
      }
    } else {
      return {
        shouldPool: true,
        shouldDeleteBalanceDoc: false,
        balance: balanceInUSD,
      }
    }
  }
}

export const updateTokensToPool = async (token: TronToken) => {
  const logger = tronPoolingLogger('updateTokenToPool', {
    userId: '',
  })
  // "poolTrx" will contain an array of all the tokens that need to be pooled.
  const tokens = await BasicCache.get('poolTrx', 'poolTrx')
  logger.info(`Insufficient funds in main wallet. Tokens in redis: ${tokens}`)
  if (!tokens) {
    logger.info(
      `Insufficient funds in main wallet. Settings new tokens in redis: ${[
        token,
      ]}`,
    )
    await BasicCache.set('poolTrx', 'poolTrx', [token], 60 * 11)
  } else if (tokens && !tokens.includes(token)) {
    tokens.push(token)
    logger.info(
      `Insufficient funds in main wallet. Settings new tokens in redis: ${tokens}`,
    )
    await BasicCache.set('poolTrx', 'poolTrx', tokens, 60 * 11)
  }
}

async function getListOfTokensToPool(): Promise<TronToken[]> {
  const logger = tronPoolingLogger('getListOfTokensToPool', { userId: null })
  const tokensToPool: TronToken[] = []

  const shouldResetBalances = config.tron.pooling.shouldResetAllBalances
  if (shouldResetBalances) {
    await resetProcessingStatus()
  }

  // If a user is withdrawing, and we have insufficient funds to complete their withdrawal,
  // then we need to pool.
  const insufficientFundsTokens = await BasicCache.get('poolTron', 'poolTron')

  // Only pool tokens that are needed
  if (insufficientFundsTokens && Array.isArray(insufficientFundsTokens)) {
    logger.info('Insufficient funds in pooling wallet', {
      insufficientFundsTokens,
    })
    insufficientFundsTokens.forEach(token => {
      if (isTronToken(token)) {
        tokensToPool.push(token)
      }
    })
    // Tokens no longer need to be pooled
    await BasicCache.invalidate('poolTron', 'poolTron')
  }

  // guarantees that we pool TRX last, if necessary
  const willPoolTrx = await shouldPoolTrx()
  if (willPoolTrx) {
    tokensToPool.push('trx')
  }

  return tokensToPool
}

// first pool TRX to pooling wallet
// THEN fund wallets with TRC20 tokens
// THEN approve pooling wallet to transfer tokens
// THEN pool TRC20 tokens with pooling wallet as the signer
// FINALLY pool TRX to cleanup (just create a TRX balance record, we can cleanup during another pooling iteration)
async function poolTronTokens(
  tokensToPool: TronToken[],
): Promise<PoolingTokensReturn<TronToken>> {
  const logger = tronPoolingLogger('poolingDeposits', { userId: null })
  logger.info('tokensToPool', tokensToPool)
  const tokensPooledSuccessfully: TronToken[] = []

  // forces trx to be pooled first
  // we do this so the pooling wallet has money to fund user wallets for TRC20 approval transactions
  const sortedTokensToPool = tokensToPool.sort((a: TronToken) =>
    a === 'trx' ? -1 : 1,
  )

  // loop through each token, with trx included
  for (const token of sortedTokensToPool) {
    // then loop through each tron_balance record for that token
    if (isTRC20Token(token)) {
      await poolTRC20(token)
    } else {
      await poolTRX()
    }

    tokensPooledSuccessfully.push(token)
  }

  if (tokensPooledSuccessfully.length) {
    return {
      success: true,
      result: {
        tokensPooled: tokensPooledSuccessfully,
      },
      error: undefined,
    }
  } else {
    return {
      success: false,
      result: undefined,
      error: new PoolingError('Could not pool any TRON tokens'),
    }
  }
}

const TronPoolingHooks: PoolingWorkerHooks<TronToken> = {
  tokensToPool: getListOfTokensToPool,
  poolTokens: poolTronTokens,
}

export const TronPoolingConfig: {
  network: Extract<CryptoNetwork, 'Tron'>
  hooks: PoolingWorkerHooks<TronToken>
} = {
  network: 'Tron',
  hooks: TronPoolingHooks,
}
