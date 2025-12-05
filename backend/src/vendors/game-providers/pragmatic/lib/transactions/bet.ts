import { checkCanPlaceBetOnGame } from 'src/modules/bet/lib/hooks'
import { type Types as UserTypes, userIsLocked } from 'src/modules/user'
import { getGame as getProviderGame } from 'src/modules/tp-games/documents/games'
import { deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { pragmaticLogger } from '../logger'
import { makeSuccessResponse, makeErrorResponse } from '../api'
import { SeamlessWalletStatusCodes } from '../enums'
import { updateGameRound } from '../../documents/game-rounds'
import { convertBalance } from '../utils'
import { displayCurrencyToCurrencyCode } from '../currencies'
import { getIdentifierForGameId } from '../games'
import { type ProcessResult } from '../types'

interface BetRequest {
  gameId: string
  roundId: string
  amount: number
  providerId: string
  timestamp: unknown
  roundDetails: unknown
  bonusCode: string
  platform: string
  language: string
  jackpotContribution: unknown
  jackpotId: string
  ipAddress: string
}

export interface BetRespFields {
  usedPromo: number
  currency: string
  cash: number
  bonus: number
}

type BetResponse = ProcessResult<BetRespFields>

/**
 * Using this method Pragmatic Playsystem will check the player balance on Casino Operator side to ensure they still
 * have the funds to cover the bet. Amount of the bet must be subtracted from player balance in Casino Operator system.
 */
export async function processBet(
  user: UserTypes.User,
  request: BetRequest,
  userCurrency: DisplayCurrency,
): Promise<BetResponse> {
  const logger = pragmaticLogger('processBet', { userId: user.id })
  const { gameId, roundId, amount } = request
  if (await userIsLocked(user)) {
    return makeErrorResponse(
      'User is disabled',
      SeamlessWalletStatusCodes.PLAYER_FROZEN,
    )
  }

  const identifier = getIdentifierForGameId(request.gameId)

  const providerGame = await getProviderGame({ identifier })
  const { canPlaceBet } = await checkCanPlaceBetOnGame(
    user,
    request.gameId,
    providerGame,
  )
  if (!canPlaceBet) {
    // TODO use reason to return a more specific status code/message
    return makeErrorResponse(
      'Game currently disabled',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }

  // amount given in cents
  if (amount < 0) {
    return makeErrorResponse(
      'Invalid stake',
      SeamlessWalletStatusCodes.BAD_PARAMS,
    )
  }

  const betAmount = Math.abs(amount)
  // We increment betAmount below, after successfully deducting balance
  const gameSession = await updateGameRound(
    { gameSessionId: roundId },
    {
      gameId,
      userId: user.id,
    },
    {
      balanceType: user.selectedBalanceType,
      currency: userCurrency,
    },
  )

  const transMeta: TransactionMeta['bet'] = {
    provider: 'pragmatic',
    gameSessionId: gameSession.gameSessionId,
    betId: 'PRAG-' + roundId,
    gameIdentifiers: { identifier },
  }

  const betAmountUSD = await currencyExchange(betAmount, userCurrency)
  logger.debug('conversion info', {
    amount,
    userCurrency,
    betAmount,
    betAmountUSD,
  })

  try {
    const balanceReturn = await deductFromBalance({
      user,
      amount: betAmountUSD,
      transactionType: 'bet',
      meta: transMeta,
      balanceTypeOverride: gameSession.balanceType,
    })

    await updateGameRound(
      { gameSessionId: roundId },
      {
        $inc: { betAmount },
      },
    )

    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      userCurrency,
      true,
    )

    return makeSuccessResponse({
      usedPromo: 0,
      cash: convertBalance(displayBalance),
      currency: displayCurrencyToCurrencyCode(userCurrency),
      bonus: 0,
    })
  } catch (error) {
    if (error.code === 1001) {
      return makeErrorResponse(
        'Insufficient funds.',
        SeamlessWalletStatusCodes.INSUFFICIENT_BALANCE,
      )
    } else {
      logger.error('internal error', {}, error)
      return makeErrorResponse(
        'Internal Error',
        SeamlessWalletStatusCodes.INTERNAL_SERVER_ERROR_NO_RECONCILE,
      )
    }
  }
}
