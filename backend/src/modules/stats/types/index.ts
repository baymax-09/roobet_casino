import { type BalanceType } from 'src/modules/user/balance'

type BalanceTypeCompatibleStatName =
  | 'withdrawn'
  | 'withdrawals'
  | 'deposited'
  | 'deposits'
  | 'refEarnings'
  | 'affiliatesTotalWagered'

export type StatName =
  | BalanceTypeCompatibleStatName
  | 'marketingBonus'
  | 'manualBonuses'
  | 'rechargeGiven'
  | 'affiliateEarningsPaid'
  | 'affiliateEarningsAdded'
  | 'refCount'
  | 'chatMessages'
  | 'emailVerify'
  | 'offerDeposits'
  | 'offerDeposited'
  | 'uniqueDeposits'
  | 'promoClaims'
  | 'promoClaimed'
  | 'rainCount'
  | 'rainTotal'
  | 'raffleGifts'
  | 'raffleGifted'
  | 'acpValueCreated'
  | 'rakebackClaims'
  | 'rakebackClaimed'
  | 'roowardsClaimed'
  | 'roowardsClaims'
  | 'roowardReloadClaims'
  | 'roowardReloadClaimed'
  | 'sportsbookBet'
  | 'sportsbookWon'
  | 'totalBet'
  | 'totalBets'
  | 'uniqueBets'
  | 'totalWon'
  | 'referredUsers'
  | 'userRegistrations'
  | 'tipped'
  | 'tipsReceived'
  | 'signups'
  | 'logins'
  | 'uniqueChatUsers'
  | `${string}Bet`
  | `${string}Bets`
  | `${string}Wins`
  | `${string}Won`
  | 'depositBonusMatched'

type BalanceTypeStatName = `${BalanceType}-${BalanceTypeCompatibleStatName}`

export type ExpandedStatName = StatName | BalanceTypeStatName

export type UserStat =
  | {
      key: StatName
      amount: number
      balanceType?: undefined
    }
  | {
      key: BalanceTypeCompatibleStatName
      amount: number
      balanceType: BalanceType
    }
