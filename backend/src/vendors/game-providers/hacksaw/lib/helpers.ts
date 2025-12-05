import { type User } from 'src/modules/user/types'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import { type BetRequest } from './events/bet'
import { type WinRequest } from './events/win'
import { type RollbackRequest } from './events/rollback'
import { HacksawError, HacksawErrorCodes } from './errors'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { getActiveBets } from 'src/modules/bet/documents/activeBetsMongo'

export const formatUserBalance = async (
  user: User | undefined,
  displayCurrency: DisplayCurrency,
): Promise<number> => {
  if (!user) {
    return 0
  }
  const balanceReturn = await getSelectedBalanceFromUser({ user })

  const convertedBalance = await currencyExchange(
    balanceReturn.balance,
    displayCurrency,
    true,
  )
  return parseInt((convertedBalance * 100).toFixed(0)) ?? 0
}
export type StateMachineRequest = BetRequest | WinRequest | RollbackRequest

export const getBetIdentifier = (request: StateMachineRequest): string => {
  if (request.action === 'Bet') {
    return request.transactionId.toString()
  }
  if (request.action === 'Win') {
    // sometimes betTransactionId is null on wins so you have to use the current txnid
    return (
      request.betTransactionId?.toString() ?? request.transactionId?.toString()
    )
  }
  if (request.action === 'Rollback') {
    return request.rolledBackTransactionId.toString()
  }
  throw new HacksawError(
    'Unexpected action schema for getBetIdentifier',
    HacksawErrorCodes.InvalidAction,
  )
}

export const getGameIdentifier = (gameId: number): string => {
  return `hacksaw:${gameId}`
}

export async function unfinishedHacksawGames({
  userId,
  sinceTimestamp,
}: {
  userId: string
  sinceTimestamp: string
}) {
  const unfinishedGames = await getActiveBets({
    userId,
    closedOut: { $exists: false },
    gameIdentifier: { $regex: /hacksaw/i },
    createdAt: {
      $gte: sinceTimestamp,
    },
  })

  return unfinishedGames
}
