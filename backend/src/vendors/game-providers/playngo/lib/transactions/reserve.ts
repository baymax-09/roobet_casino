import { checkCanPlaceBetOnGame } from 'src/modules/bet/lib/hooks'
import { t } from 'src/util/i18n'
import { type Types as UserTypes, userIsLocked } from 'src/modules/user'
import { deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { playngoLogger } from '../logger'
import { updateGameRound } from '../../documents/game-rounds'
import { StatusCodes } from '../enums'
import { convertBalance } from '../utils'
import { getDisplayCurrencyFromRequest } from '../currencies'
import { type PngResponse } from '../../documents/transactions'
import { fetchPlayngoGame } from '../games'

interface ReserveRequest {
  real: string
  roundid: string
  gameid: string
  transactionid: string
  gamesessionid: string
  currency: string
}

export const getBetIdFromRequest = ({
  roundid,
}: {
  roundid: string
}): `PNG-${string}` => `PNG-${roundid}`

export async function processReserve(
  user: UserTypes.User,
  request: ReserveRequest,
): Promise<PngResponse> {
  const logger = playngoLogger('processReserve', { userId: user.id })
  if (await userIsLocked(user)) {
    return {
      statusCode: StatusCodes.ACCOUNTLOCKED,
    }
  }
  const { real } = request
  const amount = parseFloat(real) || 0
  const reserveCurrency = getDisplayCurrencyFromRequest(request)
  if (!reserveCurrency) {
    logger.error('processReserve stopping[currency]', {
      roundId: request.roundid,
      currency: request.currency,
    })
    return {
      statusCode: StatusCodes.INVALIDCURRENCY,
    }
  }

  const providerGame = await fetchPlayngoGame(request.gameid)
  const { canPlaceBet } = await checkCanPlaceBetOnGame(
    user,
    request.gameid,
    providerGame,
  )
  // We check for providerGames existence in checkCanPlaceBetOnGame, maybe there is a better way to do this.
  if (!canPlaceBet || !providerGame) {
    // TODO use reason to return a more specific status code/message
    return {
      statusCode: StatusCodes.ACCOUNTDISABLED,
      statusMessage: t(user, 'user__game_disabled'),
    }
  }

  // We increment betAmount below, after successfully deducting balance
  const gameSession = await updateGameRound(
    { roundId: request.roundid },
    {
      gameSessionId: request.gamesessionid,
      gameId: request.gameid,
      userId: user.id,
    },
    {
      balanceType: user.selectedBalanceType,
      currency: reserveCurrency,
    },
  )

  const transMeta: TransactionMeta['bet'] = {
    provider: 'playngo',
    gameSessionId: gameSession.gameSessionId,
    betId: getBetIdFromRequest(request),
    gameIdentifiers: { identifier: providerGame.identifier },
  }

  try {
    const betAmountUSD = await currencyExchange(amount, reserveCurrency)
    logger.debug('conversion info', {
      transMeta,
      amount,
      reserveCurrency,
      real,
      betAmountUSD,
    })

    const balanceReturn = await deductFromBalance({
      user,
      amount: betAmountUSD,
      transactionType: 'bet',
      meta: transMeta,
      balanceTypeOverride: gameSession.balanceType,
    })

    await updateGameRound(
      { roundId: request.roundid },
      {
        $inc: { betAmount: amount },
      },
    )

    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      reserveCurrency,
      true,
    )

    const response = {
      externalGameSessionId: request.gamesessionid,
      real: convertBalance(displayBalance),
      statusCode: StatusCodes.OK,
    }
    return response
  } catch (error) {
    // code 1001 is no balance
    if (error.code === 1001) {
      const response = {
        statusCode: StatusCodes.NOTENOUGHMONEY,
        statusMessage: t(user, error.message),
      }
      return response
    } else {
      logger.error('unknown error for userId', {}, error)
      const response = {
        statusCode: StatusCodes.NOTENOUGHMONEY,
        statusMessage: t(user, 'bet__not_enough_balance'),
      }
      return response
    }
  }
}
