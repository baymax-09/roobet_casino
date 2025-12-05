import { config } from 'src/system'
import {
  preBetValidation,
  placeBet,
  prepareAndCloseoutActiveBet,
} from 'src/modules/bet'
import { startNewRound } from 'src/modules/game/lib/round'
import { rollNumber } from 'src/modules/game/lib/provably_fair/userGenerated'
import { APIValidationError } from 'src/util/errors'
import { type Types as UserTypes } from 'src/modules/user'
import { calculatePayoutMultiplier, determineRollSuccess } from './payout'

import { newDiceGame } from './game'
import { GameName } from '../'
import { type DiceMode } from './dice_modes'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

// payout in [2, 9]
export async function diceRoll(
  user: UserTypes.User,
  betAmount: number,
  diceMode: DiceMode,
  targetNumber: number,
  targetNumberEnd: number,
  targetNumber2: number,
  targetNumberEnd2: number,
  clientSeed: string,
  extras = {},
  freeBetItemId: string,
  balanceUpdateTimestamp: Date,
) {
  const edge = config.dice.edge
  const payoutMultiplier = calculatePayoutMultiplier(
    diceMode,
    edge,
    targetNumber,
    targetNumberEnd,
    targetNumber2,
    targetNumberEnd2,
  )
  if (payoutMultiplier < 1.01) {
    throw new APIValidationError('dice__payout_min', ['1.01x'])
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

  const game = newDiceGame()

  const preBetValidationResult = await preBetValidation({
    user,
    game,
    betAmount,
  })
  if (!preBetValidationResult.success) {
    const { message, args } = preBetValidationResult
    throw new APIValidationError(message, args)
  }

  const { hash, provablyFairInfo } = await startNewRound(
    user,
    GameName,
    clientSeed,
  )
  const roll = rollNumber(hash)

  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound?.id,
    roundHash: provablyFairInfo.currentRound?.hash,
    nonce: provablyFairInfo.currentRound?.nonce,
    roll,
    payoutMultiplier,
    ...extras,
  }
  const success = determineRollSuccess(
    roll,
    diceMode,
    targetNumber,
    targetNumberEnd,
    targetNumber2,
    targetNumberEnd2,
  )

  const bet = await placeBet({
    user,
    game,
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  const betHistory = await prepareAndCloseoutActiveBet(
    {
      ...bet,
      payoutValue: success ? betAmount * payoutMultiplier : 0,
    },
    true,
    balanceUpdateTimestamp,
  )

  return { roll, bet: betHistory, provablyFairInfo }
}
