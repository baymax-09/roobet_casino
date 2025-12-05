import { r } from 'src/system'
import { t } from 'src/util/i18n'
import { type Types as UserTypes } from 'src/modules/user'
import {
  userIsLocked,
  getUserById,
  getUserForDisplay,
  shouldHideUser,
} from 'src/modules/user'
import {
  creditBalance,
  getBalanceFromUserAndType,
} from 'src/modules/user/balance'
import { recordAndReturnBetHistory } from 'src/modules/bet/documents/bet_history_mongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import {
  updateGame as updateProviderGame,
  getGame as getProviderGame,
} from 'src/modules/tp-games/documents/games'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { type BetHistory } from 'src/modules/bet/types'
import { getGameEdge } from 'src/modules/game'
import { preventOverMaxPayout } from 'src/modules/bet/util'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { getIdentifierForGameCode } from '../games'
import {
  type Hub88GameSession,
  updateGameSession,
} from '../../documents/game-sessions'
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

export interface WinRequest {
  user: string
  transaction_uuid: string
  supplier_transaction_id: string
  token: string
  supplier_user: string
  round_closed: boolean
  round: string
  reward_uuid: string
  request_uuid: string
  reference_transaction_uuid: string
  is_free: boolean
  is_aggregated: boolean
  game_code: string
  currency: string
  bet: string
  amount: number
  /** Why is game_id working for us but not in the docs? */
  game_id: string
}

export async function processWin(
  user: UserTypes.User,
  request: WinRequest,
): Promise<Hub88TransactionResp> {
  const logger = hub88Logger('processWin', { userId: user.id })
  if (await userIsLocked(user)) {
    return makeErrorResponse(
      t(user, 'account__locked'),
      StatusCodes.RS_ERROR_USER_DISABLED,
    )
  }

  const { game_id, round_closed, round, currency } = request

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
      StatusCodes.RS_ERROR_WRONG_SYNTAX,
    )
  }

  const finished = round_closed

  const gameSession = await updateGameSession(
    { gameSessionId: round },
    {
      $inc: { payAmount: amount },
      gameId: game_id,
      userId: user.id,
      finished,
    },
    { balanceType: user.selectedBalanceType },
  )

  if (amount > 0) {
    const transMeta: TransactionMeta['payout'] = {
      betId: 'HUB88-' + gameSession.gameSessionId,
      provider: 'hub88',
      gameSessionId: gameSession.gameSessionId,
      gameIdentifiers: { aggregator: 'hub88', gid: game_id },
    }

    const exchangedWinAmount = await currencyExchange(
      request.amount,
      requestCurrency,
    )
    const winAmountUSD = convertAmountToBalance(exchangedWinAmount)

    logger.debug('conversion info', {
      transMeta,
      amount: request.amount,
      requestCurrency,
      winAmountUSD,
      exchangedWinAmount,
    })

    const overMaxPayout = await preventOverMaxPayout(
      user.id,
      winAmountUSD,
      `hub88:${request.game_code}`,
    )
    if (!overMaxPayout) {
      await creditBalance({
        user,
        amount: winAmountUSD,
        transactionType: 'payout',
        meta: transMeta,
        balanceTypeOverride: gameSession.balanceType,
      })
    }
  }

  if (finished) {
    await finishGame(user, gameSession, request)
  }

  const newUser = await getUserById(user.id)
  const balanceReturn = await getBalanceFromUserAndType({
    user: newUser!,
    balanceType: gameSession.balanceType,
  })
  const newDisplayBalance = await currencyExchange(
    balanceReturn.balance,
    requestCurrency,
    true,
  )
  const response = makeSuccessResponse(request, 'win', {
    user: user.id,
    currency,
    balance: convertBalanceToAmount(newDisplayBalance),
  })

  return response
}

async function finishGame(
  user: UserTypes.User,
  gameSession: Hub88GameSession,
  request: WinRequest,
) {
  const logger = hub88Logger('finishGame', { userId: user.id })
  const identifier = getIdentifierForGameCode(request.game_code)
  const providerGame = await getProviderGame({ identifier })
  const incognito = await shouldHideUser(user)

  if (!gameSession) {
    logger.info('finishGame stopping - no gameSession')
    return
  }

  if (!gameSession.betAmount) {
    logger.info('finishGame stopping - not recording bet because no bet amount')
    return
  }

  if (!providerGame) {
    logger.error('finishGame error - no providerGame with identifier', {
      identifier,
    })
    return
  }

  logger.info('finishGame', { gameSessionId: gameSession.gameSessionId })

  const requestCurrency = getDisplayCurrencyFromRequest(request)

  if (!requestCurrency) {
    return makeErrorResponse(
      t(user, 'unsupported__currency'),
      StatusCodes.RS_ERROR_WRONG_CURRENCY,
    )
  }

  const betAmountUSD = await currencyExchange(
    gameSession?.betAmount ?? 0,
    requestCurrency,
  )
  const winAmountUSD = await currencyExchange(
    gameSession?.payAmount ?? 0,
    requestCurrency,
  )

  const bet: BetHistory = {
    thirdParty: 'hub88',
    betAmount: betAmountUSD,
    gameSessionId: gameSession.gameSessionId,
    round: gameSession.gameSessionId,
    won: gameSession.payAmount > 0,
    gameIdentifier: identifier,
    payoutValue: winAmountUSD,
    // @ts-expect-error We are ok with this being like this - but this is wrong
    gameName: 'hub88',
    profit: winAmountUSD - betAmountUSD,
    balanceType: gameSession.balanceType,
    user: !incognito ? await getUserForDisplay(user) : null,
    userId: user.id,
    betId: 'HUB88-' + gameSession.gameSessionId,
    timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
    gameNameDisplay: providerGame.title,
    category: providerGame.category,
    twoFactor: user.twofactorEnabled || user.emailVerified,
    incognito,
  }

  updateProviderGame(
    { identifier },
    {
      $inc: {
        popularity: gameSession.betAmount,
      },
    },
  )

  recordAndReturnBetHistory(bet)
    .then(betHistory => {
      afterBetHooks({
        user,
        betHistory,
        edge: getGameEdge(providerGame.title, providerGame.payout),
      })
    })
    .catch(error => {
      logger.error('error recording bet history', {}, error)
    })
}
