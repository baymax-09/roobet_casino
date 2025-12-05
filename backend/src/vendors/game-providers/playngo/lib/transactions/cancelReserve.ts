import { type Types } from 'mongoose'

import { type Types as UserTypes } from 'src/modules/user'
import { creditBalance } from 'src/modules/user/balance'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { playngoLogger } from '../logger'
import { updateGameRound } from '../../documents/game-rounds'
import { StatusCodes } from '../enums'
import { getDisplayCurrencyFromRequest } from '../currencies'
import {
  type PngResponse,
  type PNGTransaction,
} from '../../documents/transactions'
import { fetchPlayngoGame } from '../games'
import { getBetIdFromRequest } from './reserve'

interface CancelReserveRequest {
  real: string
  roundid: string
  gameid: string
  transactionid: string
  gamesessionid: string
  currency: string
}

/**
 * This function needs to run regardless if user is locked or not
 */
export async function processCancelReserve(
  user: UserTypes.User,
  request: CancelReserveRequest,
  previousTransaction?: PNGTransaction & { _id: Types.ObjectId },
): Promise<PngResponse> {
  const logger = playngoLogger('processCancelReserve', { userId: user.id })
  if (!previousTransaction) {
    return {
      statusCode: StatusCodes.OK,
    }
  }

  const { real } = request
  const amount = parseFloat(real) || 0
  const refundCurrency = getDisplayCurrencyFromRequest(request)
  if (!refundCurrency) {
    logger.error('Playngo processCancelReserve stopping[currency]', {
      roundId: request.roundid,
      currency: request.currency,
    })
    return {
      statusCode: StatusCodes.INVALIDCURRENCY,
    }
  }

  const gameSession = await updateGameRound(
    { roundId: request.roundid },
    {
      $inc: { betAmount: -Math.abs(amount) },
      gameSessionId: request.gamesessionid,
      gameId: request.gameid,
      userId: user.id,
      finished: true,
    },
  )

  if (!gameSession) {
    const response = {
      externalTransactionId: '',
      statusCode: StatusCodes.OK,
    }
    return response
  }

  const providerGame = await fetchPlayngoGame(request.gameid)
  const transMeta = {
    provider: 'playngo',
    gameSessionId: gameSession.gameSessionId,
    betId: getBetIdFromRequest(request),
    gameIdentifiers: { identifier: providerGame?.identifier },
  }

  const refundAmountUSD = await currencyExchange(amount, refundCurrency)
  logger.debug('conversion info', {
    transMeta,
    amount,
    refundCurrency,
    real,
    refundAmountUSD,
  })

  await creditBalance({
    user,
    amount: refundAmountUSD,
    transactionType: 'refund',
    meta: transMeta,
    balanceTypeOverride: gameSession.balanceType,
  })

  const response = {
    externalTransactionId: previousTransaction ? previousTransaction._id : '',
    statusCode: StatusCodes.OK,
  }
  return response
}
