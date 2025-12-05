import { UserStatsModel } from 'src/modules/stats'
import { type StatName } from 'src/modules/stats/types'

export const dailyStatsForUser = async (
  startDate: string,
  endDate: string,
  userId: string,
) => {
  const fields: StatName[] = [
    'deposited',
    'deposits',
    'withdrawn',
    'withdrawals',
    'totalBet',
    'totalBets',
    'totalWon',
    'rechargeGiven',
    'manualBonuses',
    'marketingBonus',
    'roowardsClaimed',
    'roowardsClaims',
    'tipped',
    'tipsReceived',
    'affiliateEarningsAdded',
    'promoClaimed',
    'promoClaims',
    'depositBonusMatched',
  ]
  const stats = await UserStatsModel.sumUserStatFields(
    userId,
    startDate,
    endDate,
    fields,
  )

  return { stats }
}
