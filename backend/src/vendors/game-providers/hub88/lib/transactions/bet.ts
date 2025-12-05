import { t } from 'src/util/i18n'
import { type Types as UserTypes, userIsLocked } from 'src/modules/user'
import { checkCanPlaceBetOnGame } from 'src/modules/bet/lib/hooks'
import { getGame as getProviderGame } from 'src/modules/tp-games/documents/games'
import { deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { getIdentifierForGameCode } from '../games'
import { updateGameSession } from '../../documents/game-sessions'
import { StatusCodes } from '../enums'
import {
  convertBalanceToAmount,
  convertAmountToBalance,
  makeSuccessResponse,
  makeErrorResponse,
  type Hub88TransactionResp,
} from '../utils'
import { getDisplayCurrencyFromRequest } from '../currencies'
import { hub88Logger } from '../logger'

export interface BetRequest {
  user: string
  transaction_uuid: string
  supplier_transaction_id: string
  token: string
  supplier_user: string
  round_closed: boolean
  round: string
  reward_uuid: string
  request_uuid: string
  is_free: boolean
  is_aggregated: boolean
  game_code: string
  currency: string
  bet: string
  amount: number
  /** Why is game_id working for us but not in the docs? */
  game_id: string
}

export async function processBet(
  user: UserTypes.User,
  request: BetRequest,
): Promise<Hub88TransactionResp> {
  const logger = hub88Logger('processBet', { userId: user.id })
  const { game_id, round_closed, round, currency } = request

  if (await userIsLocked(user)) {
    return makeErrorResponse(
      t(user, 'account__locked'),
      StatusCodes.RS_ERROR_USER_DISABLED,
    )
  }

  const identifier = getIdentifierForGameCode(request.game_code)

  const providerGame = await getProviderGame({ identifier })
  const { canPlaceBet } = await checkCanPlaceBetOnGame(
    user,
    request.game_code,
    providerGame,
  )
  if (!canPlaceBet) {
    // TODO use reason to return a more specific status code/message
    return makeErrorResponse(
      t(user, 'bet__disallowed'),
      StatusCodes.RS_ERROR_INVALID_GAME,
    )
  }

  const requestCurrency = getDisplayCurrencyFromRequest(request)
  if (!requestCurrency) {
    return makeErrorResponse(
      t(user, 'unsupported__currency'),
      StatusCodes.RS_ERROR_WRONG_CURRENCY,
    )
  }

  const amount = convertAmountToBalance(request.amount)
  if (amount < 0) {
    return makeErrorResponse(
      t(user, 'bet__invalid'),
      StatusCodes.RS_ERROR_WRONG_TYPES,
    )
  }

  const gameSession = await updateGameSession(
    { gameSessionId: round },
    {
      gameId: game_id,
      userId: user.id,
      finished: round_closed,
    },
    {
      balanceType: user.selectedBalanceType,
      currency: requestCurrency,
    },
  )

  const transMeta: TransactionMeta['bet'] = {
    betId: 'HUB88-' + gameSession.gameSessionId,
    provider: 'hub88',
    gameSessionId: gameSession.gameSessionId,
    gameIdentifiers: { identifier },
  }

  const exchangedBetAmount = await currencyExchange(
    request.amount,
    requestCurrency,
  )
  const betAmountUSD = convertAmountToBalance(exchangedBetAmount)
  logger.debug('conversion info', {
    transMeta,
    exchangedBetAmount,
    betAmountUSD,
    requestCurrency,
    amount: request.amount,
  })

  try {
    const balanceReturn = await deductFromBalance({
      user,
      amount: betAmountUSD,
      transactionType: 'bet',
      meta: transMeta,
      balanceTypeOverride: gameSession.balanceType,
    })

    /**
     * We had to separate this from the one above because a player was able to make a ton of failed bet attempts higher
     * than their balance and then make one bet below their balance and we incremented the game session before failing
     * the bet attempt for low balance.
     */
    await updateGameSession(
      { gameSessionId: round },
      {
        $inc: { betAmount: amount },
      },
    )
    const displayBalance = await currencyExchange(
      balanceReturn.balance,
      requestCurrency,
      true,
    )

    const response = makeSuccessResponse(request, 'bet', {
      user: user.id,
      currency,
      balance: convertBalanceToAmount(displayBalance),
    })
    return response
  } catch (error) {
    if (error.message === 'bet__not_enough_balance') {
      return makeErrorResponse(
        t(user, 'bet__not_enough_balance'),
        StatusCodes.RS_ERROR_NOT_ENOUGH_MONEY,
      )
    } else {
      logger.error(`failed to process bet for user: ${user.id}`, {}, error)
      return makeErrorResponse(
        t(user, 'bet__not_enough_balance'),
        StatusCodes.RS_ERROR_NOT_ENOUGH_MONEY,
      )
    }
  }
}
