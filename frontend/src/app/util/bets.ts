import moment from 'moment'
import numeral from 'numeral'

import { type BetHistory, type NormalizedBet } from 'common/types/bets'

export const normalizeBet = (
  bet: BetHistory,
  light: boolean = false,
): NormalizedBet => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- This is a valid cast.
  const normalized = { ...bet } as NormalizedBet
  normalized.light = light

  let payout = 0

  if (bet.gameName === 'crash') {
    payout = normalized.cashoutCrashPoint
  } else if (normalized.gameName === 'dice') {
    payout = normalized.profit ? normalized.payoutMultiplier : 0
  } else {
    payout = normalized.profit
      ? normalized.payoutValue / normalized.betAmount
      : 1
  }

  if (normalized.gameName === 'SoftSwiss') {
    normalized.gameName = 'dice'
  }

  normalized._payout = normalized.won
    ? numeral(payout).format('0.00') + 'x'
    : '0.00x'
  normalized._timestamp = moment(normalized.timestamp).format('LT')
  normalized._betAmount = numeral(normalized.betAmount).format('$0,0.00')
  normalized._profit = numeral(
    normalized.payoutValue || -normalized.betAmount,
  ).format('$0,0.00')

  return normalized
}
