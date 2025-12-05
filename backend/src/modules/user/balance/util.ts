import { userLogger } from '../lib/logger'
import {
  type UserObjectBalanceField,
  type BalanceType,
  type BalanceIdentifier,
  type UserObjectBalanceType,
  isBalanceType,
  isUserObjectBalanceField,
  type SelectedBalanceField,
  isUserObjectBalanceType,
  type UserBalances,
} from '../types'

type UserObjectBetGoalField =
  | 'betGoal'
  | 'cashBetGoal'
  | 'ethBetGoal'
  | 'ltcBetGoal'

const DEFAULT_BALANCE_TYPE = 'crypto'

export const balanceTypeToUserObjectBalanceField = (
  balanceType: UserObjectBalanceType,
): UserObjectBalanceField => {
  return (
    {
      cash: 'cashBalance',
      eth: 'ethBalance',
      crypto: 'balance',
      ltc: 'ltcBalance',
    } as const
  )[balanceType]
}

export const balanceTypeToSelectedBalanceField = (
  balanceType: BalanceType,
): SelectedBalanceField => {
  if (isUserObjectBalanceType(balanceType)) {
    return balanceTypeToUserObjectBalanceField(balanceType)
  }
  return balanceType
}

const userObjectBalanceFieldToBalanceType = (
  selectedBalanceField: UserObjectBalanceField,
): BalanceType => {
  return (
    {
      cashBalance: 'cash',
      ethBalance: 'eth',
      balance: 'crypto',
      ltcBalance: 'ltc',
    } as const
  )[selectedBalanceField]
}

interface BalanceIdentifierArg {
  balanceIdentifier?: BalanceIdentifier | null
}

export const validateAndGetBalanceType = ({
  balanceIdentifier = DEFAULT_BALANCE_TYPE,
}: BalanceIdentifierArg): BalanceType => {
  if (!balanceIdentifier) {
    return DEFAULT_BALANCE_TYPE
  }
  if (isBalanceType(balanceIdentifier)) {
    return balanceIdentifier
  }
  if (isUserObjectBalanceField(balanceIdentifier)) {
    return userObjectBalanceFieldToBalanceType(balanceIdentifier)
  }
  userLogger('validateAndGetBalanceType', { userId: null }).error(
    `Invalid balance identifier`,
    { balanceIdentifier },
  )
  throw new Error(`Invalid balance identifier, ${balanceIdentifier}`)
}

export const getSelectedBalanceFieldFromIdentifier = ({
  balanceIdentifier,
}: BalanceIdentifierArg) => {
  return balanceTypeToSelectedBalanceField(
    validateAndGetBalanceType({ balanceIdentifier }),
  )
}

export const getUserBetGoalFieldFromBalanceType = (
  balanceType: UserObjectBalanceType,
): UserObjectBetGoalField => {
  return (
    {
      cash: 'cashBetGoal',
      crypto: 'betGoal',
      eth: 'ethBetGoal',
      ltc: 'ltcBetGoal',
    } as const
  )[balanceType]
}

export const totalBalance = (balances: UserBalances) => {
  const { selectedBalanceType, ...userBalances } = balances

  return Object.values(userBalances).reduce((acc, value) => {
    return acc + value
  }, 0)
}
