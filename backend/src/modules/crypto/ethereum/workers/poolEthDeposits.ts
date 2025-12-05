import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { BasicCache } from 'src/util/redisModels'

import { ERC20Tokens, isETHToken, type ETHToken } from '../types'
import {
  shouldPoolEth,
  poolERC20,
  poolEth,
  shouldPoolERC20,
} from '../lib/pooling/pooling'
import { getBalancesByToken } from '../documents/ethereum_balances'
import { cryptoLogger } from '../../lib/logger'

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('poolEthDeposits', start)
  }
}

async function start() {
  const shouldRun = config.ethereum.shouldEmergencyPool
  await poolDeposits(shouldRun)

  while (true) {
    await sleep(1000 * 60 * 10)
    await poolDeposits()
  }
}

async function getListOfTokensToPool(shouldEmergencyPool?: boolean) {
  const tokensToPool: ETHToken[] = []

  // If a user is withdrawing, and we have insufficient funds to complete their withdrawal,
  // then we need to pool.
  const insufficientFundsTokens = await BasicCache.get('poolEth', 'poolEth')

  // Only pool tokens that are needed
  if (insufficientFundsTokens && Array.isArray(insufficientFundsTokens)) {
    cryptoLogger('ethereum/workers/getListOfTokensToPool', {
      userId: null,
    }).info(
      `Insufficient funds in pooling worker - ${insufficientFundsTokens}`,
      { insufficientFundsTokens },
    )
    insufficientFundsTokens.forEach(token => {
      if (isETHToken(token)) {
        tokensToPool.push(token)
      }
    })
    // Tokens no longer need to be pooled
    await BasicCache.invalidate('poolEth', 'poolEth')
  }

  for (const token of ERC20Tokens) {
    const shouldPoolToken =
      shouldEmergencyPool || (await shouldPoolERC20(token))
    if (shouldPoolToken && !tokensToPool.includes(token)) {
      tokensToPool.push(token)
    }
  }

  // guarantees that we pool ETH last, if necessary
  const willPoolEth = shouldEmergencyPool || (await shouldPoolEth())
  if (willPoolEth) {
    tokensToPool.push('eth')
  }

  return tokensToPool
}

async function poolDeposits(shouldEmergencyPool?: boolean) {
  const logger = cryptoLogger('ethereum/workers/poolDeposits', { userId: null })
  logger.info('poolDeposits - start')
  const tokensToPool = await getListOfTokensToPool(shouldEmergencyPool)
  logger.info(`Tokens to pool: ${tokensToPool}`)

  // loop through each token, with eth included
  for (const token of tokensToPool) {
    const allBalances = await getBalancesByToken(token)
    const walletsToPool = allBalances.filter(balance => !balance.processing)
    logger.info(
      `poolDeposits - found ${walletsToPool.length} available wallets with ${token} balances out of ${allBalances.length}`,
      { token },
    )

    // then loop through each ethereum_balance record for that token
    for (const [index, wallet] of walletsToPool.entries()) {
      logger.info(`Wallet ${index + 1} pooling ${token}`, { token, wallet })
      if (token === 'eth') {
        await poolEth({
          wallet,
        })
      } else if (ERC20Tokens.includes(token)) {
        logger.info(`Wallet - ${token}`, { token, wallet })
        await poolERC20({
          wallet,
          token,
        })
      }
    }
  }
}
