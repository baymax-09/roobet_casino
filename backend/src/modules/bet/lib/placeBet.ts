import { type Types as UserTypes, shouldHideUser } from 'src/modules/user'
import { getGame } from 'src/modules/tp-games/documents/games'
import {
  deductFromBalance,
  getSelectedBalanceFromUser,
} from 'src/modules/user/balance'

import { checkCanPlaceBetOnGame } from './hooks'
import {
  type ActiveBet,
  getOrCreateActiveBet,
  updateActiveBet,
} from '../documents/activeBetsMongo'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'

interface PlaceBetSuccess {
  success: true
  activeBet: ActiveBet
}

interface PlaceBetError {
  success: false
  message: string
  status?: 'insufficient_balance' | string
}

interface PlaceThirdPartyBetArgs {
  user: UserTypes.User
  gameIdentifier: string
  betAmount: number
  meta: Record<string, any>
  externalIdentifier: string
}

export const placeThirdPartyBet = async ({
  user,
  gameIdentifier,
  betAmount,
  meta,
  externalIdentifier,
}: PlaceThirdPartyBetArgs): Promise<PlaceBetSuccess | PlaceBetError> => {
  const game = await getGame({ identifier: gameIdentifier })
  const { betId } = meta

  if (!game) {
    return {
      success: false,
      message: 'Invalid game identifier.',
    }
  }

  if (isNaN(betAmount)) {
    return {
      success: false,
      message: 'Invalid bet amount.',
    }
  }

  const { balance, balanceType } = await getSelectedBalanceFromUser({ user })

  const { canPlaceBet } = await checkCanPlaceBetOnGame(
    user,
    gameIdentifier,
    game,
    balanceType,
  )
  // TODO use reason from checkCanPlaceBetOnGame in message
  if (!canPlaceBet) {
    return {
      success: false,
      message: 'Cannot place bet, Please contact support for more information.',
    }
  }

  if (betAmount > balance) {
    return {
      success: false,
      status: 'insufficient_balance',
      message: 'Cannot place bet, not enough available balance.',
    }
  }

  const takeBalanceMeta: TransactionMeta['bet'] = {
    provider: game.provider,
    providerBetId: meta.providerBetId,
    betId,
    externalIdentifier,
    gameIdentifiers: { identifier: gameIdentifier },
  }

  await deductFromBalance({
    user,
    amount: betAmount,
    transactionType: 'bet',
    balanceTypeOverride: balanceType,
    meta: takeBalanceMeta,
  })

  const activeBet = await getOrCreateActiveBet({
    externalIdentifier,
    gameIdentifier,
    userId: user.id,
  })

  // Update ActiveBet record with additional fields.
  const incognito = await shouldHideUser(user)

  await updateActiveBet(activeBet._id, {
    selectedBalanceType: balanceType,
    highroller: betAmount > 100,
    gameIdentifier,
    hidden: false,
    amount: betAmount,
    incognito,
    meta,
  })

  return {
    success: true,
    activeBet,
  }
}
