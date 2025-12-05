import { APIValidationError } from 'src/util/errors'
import { updateUser } from 'src/modules/user'
import { determineUserTokenFeatureAccess } from 'src/util/features'
import { filterAsync } from 'src/util/helpers/lists'

import {
  type TransactionMeta,
  createTransaction,
  type TransactionType,
} from '../documents/transaction'
import {
  creditUserId,
  takeBalanceFromUserObject,
  updateUserObjectBalanceAndTransaction,
} from '../documents/user'
import {
  adminUpdatePortfolioBalance,
  incrementPortfolioBalance,
  getPortfolio,
  getPortfolioBalance,
} from '../documents/portfolio'
import {
  balanceTypeToUserObjectBalanceField,
  validateAndGetBalanceType,
} from './util'
import {
  type BalanceType,
  type UserBalances,
  type PortfolioBalanceType,
  PortfolioBalanceTypes,
  isPortfolioBalanceType,
} from '../types/Balance'
import { type User, type DBUser } from '../types/User'
import { userLogger } from '../lib/logger'

interface UpdatePortfolioBalance<Type extends TransactionType> {
  user: User
  transactionType: Type
  balanceType: PortfolioBalanceType
  amount: number
  meta: TransactionMeta[Type]
  // The timestamp when the balance should update on the client. Used for delayed balance updates.
  balanceUpdateTimestamp?: Date
}

interface DeductFromBalance<Type extends TransactionType> {
  user: User
  amount: number
  transactionType: Type
  meta: TransactionMeta[Type]
  balanceTypeOverride: BalanceType | null
  // The timestamp when the balance should update on the client. Used for delayed balance updates.
  balanceUpdateTimestamp?: Date
  allowNegative?: boolean
}

interface CreditBalance<Type extends TransactionType> {
  user: User
  /** In the case of adminSetBalance this is the new balance, not the delta. */
  amount: number
  transactionType: Type
  meta: TransactionMeta[Type]
  balanceTypeOverride: BalanceType | null
  // The timestamp when the balance should update on the client. Used for delayed balance updates.
  balanceUpdateTimestamp?: Date
}

interface AddAdminUserBalanceArgs<
  Type extends Extract<
    TransactionType,
    'adminAddBalance' | 'marketingBonus' | 'bonus'
  >,
> {
  user: User
  amount: number
  transactionType: Type
  meta: TransactionMeta[Type]
  balanceTypeOverride: BalanceType | null
}

interface AdminChangePortfolioBalanceArgs<
  Type extends Extract<
    TransactionType,
    'adminAddBalance' | 'adminSetBalance' | 'marketingBonus' | 'bonus'
  >,
> {
  user: User
  amount: number
  meta: TransactionMeta[Type]
  balanceTypeOverride: PortfolioBalanceType
  transactionType: Type
}

interface BalanceTransactionReturn {
  /** @todo there should always be a transactionId, update this typing and fix underlying system */
  transactionId: string | undefined
  balance: number
  balanceType: BalanceType
}

export type BalanceReturn = Omit<BalanceTransactionReturn, 'transactionId'>
type ChangeBalanceReturn = Omit<BalanceTransactionReturn, 'balanceType'>

type PortfolioBalances = Record<PortfolioBalanceType, number>

const getUserPortfolioBalances = async (
  user: DBUser,
): Promise<PortfolioBalances> => {
  const balances: PortfolioBalances = {
    usdc: 0,
    usdt: 0,
    xrp: 0,
    doge: 0,
    trx: 0,
  }

  const portfolio = await getPortfolio({ userId: user.id })

  if (!portfolio?.balances) {
    return balances
  }

  const filteredBalanceTypes = await filterAsync<PortfolioBalanceType>(
    [...PortfolioBalanceTypes],
    async token =>
      await determineUserTokenFeatureAccess({ token, user, countryCode: '' }),
  )

  return filteredBalanceTypes.reduce(
    (balances, token) => ({
      ...balances,
      [token]: portfolio.balances[token]?.balance ?? 0,
    }),
    balances,
  )
}

export const mapBalanceInformation = async (
  user: DBUser,
): Promise<UserBalances> => {
  const balanceData = {
    selectedBalanceType: validateAndGetBalanceType({
      balanceIdentifier: user.selectedBalanceField,
    }),
    eth: user.ethBalance ?? 0,
    crypto: user.balance ?? 0,
    cash: user.cashBalance ?? 0,
    ltc: user.ltcBalance ?? 0,
  }

  const portfolioBalances = await getUserPortfolioBalances(user)

  const allBalances: UserBalances = {
    ...balanceData,
    ...portfolioBalances,
  }

  if (!Object.keys(allBalances).includes(allBalances.selectedBalanceType)) {
    allBalances.selectedBalanceType = 'crypto'
    await updateUser(user.id, { selectedBalanceField: 'balance' })
  }

  return allBalances
}

export const getBalanceFromUserAndType = async ({
  user,
  balanceType,
}: {
  user: User
  balanceType: BalanceType
}): Promise<BalanceReturn> => {
  if (isPortfolioBalanceType(balanceType)) {
    const balances = await mapBalanceInformation(user)

    return { balance: balances[balanceType], balanceType }
  }

  const field = balanceTypeToUserObjectBalanceField(balanceType)
  const balance = user[field] ?? 0

  return { balance, balanceType }
}

/**
 * Gets the users selected balance and returns it. The `balance` is always USD.
 * @param param0 The user
 * @returns The balance (in USD) and the balance type.
 */
export const getSelectedBalanceFromUser = async ({
  user,
}: {
  user: User
}): Promise<BalanceReturn> => {
  const balanceType = validateAndGetBalanceType({
    balanceIdentifier: user.selectedBalanceType,
  })

  const { balance } = await getBalanceFromUserAndType({ user, balanceType })

  return { balance, balanceType }
}

/** Used to change a user's portfolio balances as a staff member. */
export const adminChangePortfolioBalance = async <
  T extends 'marketingBonus' | 'adminSetBalance' | 'adminAddBalance' | 'bonus',
>({
  user,
  amount,
  meta,
  balanceTypeOverride,
  transactionType,
}: AdminChangePortfolioBalanceArgs<T>): Promise<ChangeBalanceReturn> => {
  const logger = userLogger('adminChangePortfolioBalance', { userId: user.id })
  const validTransactionTypes = [
    'adminAddBalance',
    'adminSetBalance',
    'marketingBonus',
    'bonus',
  ] as const

  if (!validTransactionTypes.includes(transactionType)) {
    throw new Error('Invalid transaction type was supplied.')
  }

  /*
   * We explicitly pass replace to updateUserBalanceAndTransaction but base this logic on the transaction type here.
   * We should probably pick one method for both.
   */
  const replace = transactionType === 'adminSetBalance'

  const balanceReturn = await (async () => {
    const { previousBalance, resultantBalance } = replace
      ? await adminUpdatePortfolioBalance({
          userId: user.id,
          amount,
          balanceTypeOverride,
        })
      : await incrementPortfolioBalance({
          userId: user.id,
          type: balanceTypeOverride,
          amount,
        })

    const delta = (() => {
      if (replace) {
        // This should not happen
        if (previousBalance === undefined) {
          return undefined
        }
        return resultantBalance - previousBalance
      }

      return amount
    })()

    if (delta === undefined) {
      logger.error(`adminChangePortfolioBalance failed`, {
        amount,
        balanceTypeOverride,
        transactionType,
      })
      return undefined
    }

    const data = await (async () => {
      try {
        const { transactionId } = await createTransaction({
          user,
          // amount should be the delta, which requires some math here if we just replaced the balance with amount
          amount: delta,
          transactionType,
          meta,
          balanceType: balanceTypeOverride,
          resultantBalance,
        })
        return { balance: resultantBalance, transactionId }
      } catch (err) {
        logger.error(
          'Transaction log failed',
          {
            amount: delta,
            transactionType,
            meta,
            balanceType: balanceTypeOverride,
            resultantBalance,
          },
          err,
        )
        return { balance: resultantBalance, transactionId: undefined }
      }
    })()

    return { balance: resultantBalance, transactionId: data?.transactionId }
  })()

  if (!balanceReturn) {
    throw new Error('Unable to change balance, rolled back the update')
  }
  return balanceReturn
}

/** Used to change both user object and portfolio balances as staff member. */
export async function adminReplaceUserBalance({
  user,
  amount,
  meta,
  balanceTypeOverride,
}: Omit<
  CreditBalance<'adminSetBalance'>,
  'transactionType'
>): Promise<BalanceTransactionReturn> {
  const transactionType = 'adminSetBalance'
  const balanceType = validateAndGetBalanceType({
    balanceIdentifier: balanceTypeOverride ?? user.selectedBalanceType,
  })

  if (isPortfolioBalanceType(balanceType)) {
    const balanceReturn = await adminChangePortfolioBalance({
      user,
      amount,
      meta,
      balanceTypeOverride: balanceType,
      transactionType,
    })
    return {
      balance: balanceReturn.balance,
      transactionId: balanceReturn.transactionId,
      balanceType,
    }
  }

  const { transactionId } =
    await updateUserObjectBalanceAndTransaction<'adminSetBalance'>(
      user,
      amount,
      transactionType,
      meta,
      balanceType,
      true,
    )
  const { balance } = await getBalanceFromUserAndType({ user, balanceType })
  return { balance, balanceType, transactionId: transactionId ?? undefined }
}

/** Used to set both user object and portfolio balances as staff member. */
export const adminAddUserBalance = async <
  Type extends 'marketingBonus' | 'adminAddBalance' | 'bonus',
>({
  user,
  amount,
  transactionType,
  meta,
  balanceTypeOverride,
}: AddAdminUserBalanceArgs<Type>): Promise<BalanceTransactionReturn> => {
  const balanceType = validateAndGetBalanceType({
    balanceIdentifier: balanceTypeOverride ?? user.selectedBalanceType,
  })
  if (isPortfolioBalanceType(balanceType)) {
    const balanceReturn = await adminChangePortfolioBalance({
      user,
      amount,
      meta,
      balanceTypeOverride: balanceType,
      transactionType,
    })
    return {
      balance: balanceReturn.balance,
      transactionId: balanceReturn.transactionId,
      balanceType,
    }
  }
  const transactionReturn = await creditUserId(
    user.id,
    amount,
    transactionType,
    meta,
    balanceType,
  )

  const { balance } = await getBalanceFromUserAndType({ user, balanceType })

  return {
    balance,
    balanceType,
    transactionId: transactionReturn?.transactionId ?? undefined,
  }
}

/** Used to deduct from portfolio balances. */
export const withdrawFromPortfolio = async <T extends TransactionType>({
  user,
  amount,
  balanceType,
  transactionType,
  meta,
}: UpdatePortfolioBalance<T>): Promise<
  Omit<BalanceTransactionReturn, 'balanceType'>
> => {
  const activePortfolioBalance = await getPortfolioBalance({
    userId: user.id,
    balanceType,
  })

  // FreespinBets have amount=0 but we still want transactions for record keeping.
  if (amount !== 0) {
    if (!activePortfolioBalance) {
      throw new APIValidationError('altcoin__portfolio__unavailable')
    }

    if (!activePortfolioBalance?.balance) {
      throw new APIValidationError('altcoin__balance__unavailable')
    }

    if (activePortfolioBalance.balance < amount) {
      throw new APIValidationError('bet__not_enough_balance')
    }
  }

  const balanceReturn = await (async () => {
    const { resultantBalance } = await incrementPortfolioBalance({
      userId: user.id,
      amount: -amount,
      type: balanceType,
    })

    const data = await (async () => {
      try {
        return await createTransaction({
          user,
          amount: -1 * Math.abs(amount),
          transactionType,
          meta,
          balanceType,
          resultantBalance,
        })
      } catch (err) {
        userLogger('withdrawFromPortfolio', { userId: user.id }).error(
          'Transaction log failed',
          {
            amount: -1 * Math.abs(amount),
            transactionType,
            meta,
            balanceType,
            resultantBalance,
          },
          err,
        )
        return { balance: resultantBalance, transactionId: undefined }
      }
    })()

    return { balance: resultantBalance, transactionId: data?.transactionId }
  })()

  if (!balanceReturn) {
    throw new Error(
      'Unable to complete portfolio balance deduction, rolling back',
    )
  }
  return balanceReturn
}

/** Used to add to portfolio balances. */
export const creditPortfolio = async <T extends TransactionType>({
  user,
  amount,
  balanceType,
  transactionType,
  meta,
  balanceUpdateTimestamp,
}: UpdatePortfolioBalance<T>): Promise<
  Omit<BalanceTransactionReturn, 'balanceType'>
> => {
  const balanceReturn = await (async () => {
    const logger = userLogger('creditPortfolio', { userId: user.id })
    const { resultantBalance } = await (async () => {
      try {
        return await incrementPortfolioBalance({
          userId: user.id,
          type: balanceType,
          amount,
        })
      } catch (error) {
        logger.error(
          `Credit portfolio error for user ${user.id}, amount ${amount}, balanceType ${balanceType}`,
          { amount, balanceType },
          error,
        )
        throw error
      }
    })()

    const data = await (async () => {
      try {
        const { transactionId } = await createTransaction({
          user,
          amount: Math.abs(amount),
          transactionType,
          meta,
          balanceType,
          resultantBalance,
          balanceUpdateTimestamp,
        })
        return { balance: resultantBalance, transactionId }
      } catch (err) {
        logger.error(
          'Transaction log failed',
          {
            user,
            amount: Math.abs(amount),
            transactionType,
            meta,
            balanceType,
            resultantBalance,
            balanceUpdateTimestamp,
          },
          err,
        )
        return { balance: resultantBalance, transactionId: undefined }
      }
    })()

    return { balance: resultantBalance, transactionId: data?.transactionId }
  })()

  if (!balanceReturn) {
    throw new Error('Unable to complete bet, rolled back transaction')
  }

  return balanceReturn
}

/** Used to add to both user object and portfolio balances. */
export const creditBalance = async <Type extends TransactionType>({
  user,
  amount,
  transactionType,
  meta,
  balanceTypeOverride,
  balanceUpdateTimestamp,
}: CreditBalance<Type>): Promise<BalanceTransactionReturn> => {
  const balanceType = validateAndGetBalanceType({
    balanceIdentifier: balanceTypeOverride ?? user.selectedBalanceType,
  })
  if (isPortfolioBalanceType(balanceType)) {
    const creditArgs = {
      user,
      amount,
      balanceType,
      transactionType,
      meta,
      logTransaction: true,
      balanceUpdateTimestamp,
    }
    const { balance, transactionId } = await creditPortfolio(creditArgs)
    return { balance, transactionId, balanceType }
  }

  const transactionReturn = await creditUserId(
    user.id,
    amount,
    transactionType,
    meta,
    balanceType,
    balanceUpdateTimestamp,
  )

  const { balance } = await getBalanceFromUserAndType({ user, balanceType })

  return {
    balance,
    balanceType,
    transactionId: transactionReturn?.transactionId ?? undefined,
  }
}

/** Used to subtract from both user object and portfolio balances. */
export const deductFromBalance = async <Type extends TransactionType>({
  user,
  amount,
  transactionType,
  meta,
  balanceTypeOverride,
  balanceUpdateTimestamp,
  allowNegative = false,
}: DeductFromBalance<Type>): Promise<BalanceTransactionReturn> => {
  const balanceType = validateAndGetBalanceType({
    balanceIdentifier: balanceTypeOverride ?? user.selectedBalanceType,
  })

  if (isPortfolioBalanceType(balanceType)) {
    const withdrawalArgs = {
      user,
      amount,
      balanceType,
      transactionType,
      meta,
    }
    const { balance, transactionId } =
      await withdrawFromPortfolio(withdrawalArgs)
    return { balance, transactionId, balanceType }
  }

  const { balance } = await takeBalanceFromUserObject({
    user,
    amount,
    balanceType,
    allowNegative,
  })

  try {
    const data = await createTransaction({
      user,
      amount: -1 * Math.abs(amount),
      transactionType,
      balanceType,
      meta,
      resultantBalance: balance,
      balanceUpdateTimestamp,
    })
    return { balance, transactionId: data.transactionId, balanceType }
  } catch (err) {
    userLogger('deductFromBalance', { userId: user.id }).error(
      'Transaction log creation failed',
      {
        user,
        amount: -1 * Math.abs(amount),
        transactionType,
        balanceType,
        meta,
        resultantBalance: balance,
        balanceUpdateTimestamp,
      },
      err,
    )
    return { balance, transactionId: undefined, balanceType }
  }
}
