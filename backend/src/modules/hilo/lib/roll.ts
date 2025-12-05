import { config } from 'src/system'
import { placeBet, prepareAndCloseoutActiveBet } from 'src/modules/bet'
import { startNewRound } from 'src/modules/game/lib/round'
import { rollNumber } from 'src/modules/game/lib/provably_fair/userGenerated'
import { APIValidationError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import { calculatePayoutMultiplier, determineRollSuccess } from './payout'

import { newHiloGame } from './game'
import { GameName } from '..'
import { type HiloMode } from './hilo_modes'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

// payout in [2, 9]
export async function hiloRoll(
  user: UserTypes.User,
  betAmount: number,
  hiloMode: HiloMode,
  targetNumber: number,
  clientSeed: string,
  extras = {},
  freeBetItemId: string,
) {
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    GameName,
    clientSeed,
  )
  const roll = rollNumber(hash)
  const edge = config.hilo.edge
  const payoutMultiplier = calculatePayoutMultiplier(
    hiloMode,
    edge,
    targetNumber,
  )
  if (payoutMultiplier < 1.01) {
    throw new APIValidationError('hilo__payout_min', ['1.01x'])
  }
  if (payoutMultiplier * betAmount > config.bet.maxProfit) {
    const convertedMaxProfitAmount = await exchangeAndFormatCurrency(
      config.bet.maxProfit,
      user,
    )
    throw new APIValidationError('bet__exceeds_max_profit', [
      convertedMaxProfitAmount,
    ])
  }

  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound?.id,
    roundHash: provablyFairInfo.currentRound?.hash,
    nonce: provablyFairInfo.currentRound?.nonce,
    roll,
    payoutMultiplier,
    ...extras,
  }
  const success = determineRollSuccess(roll, hiloMode, targetNumber)

  const bet = await placeBet({
    user,
    game: newHiloGame(),
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  bet.payoutValue = success ? betAmount * payoutMultiplier : 0

  const betHistory = await prepareAndCloseoutActiveBet(bet)

  return { roll, bet: betHistory, provablyFairInfo }
}
