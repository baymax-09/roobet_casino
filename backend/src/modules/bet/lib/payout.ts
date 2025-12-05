import { type Types as UserTypes } from 'src/modules/user'
import { creditBalance } from 'src/modules/user/balance'
import { type BetHistoryDocument } from '../types'
import { preventOverMaxPayout } from '../util'

export async function payoutBet(
  user: UserTypes.User,
  bet: BetHistoryDocument,
  balanceUpdateTimestamp: Date = new Date(),
): Promise<BetHistoryDocument> {
  if (!bet.won) {
    return bet
  }
  const payout = bet?.payoutValue ?? 0
  const overMaxPayout = await preventOverMaxPayout(
    user.id,
    payout,
    `housegames:${bet.gameIdentifier}`,
  )

  if (!overMaxPayout) {
    await creditBalance({
      user,
      amount: payout,
      transactionType: 'payout',
      meta: {
        provider: 'roobet',
        betId: bet.betId,
        gameIdentifiers: { gameName: bet.gameName },
      },
      balanceTypeOverride: bet.balanceType,
      balanceUpdateTimestamp,
    })
  }

  return bet
}
