import { r } from 'src/system'
import {
  getUserById,
  getUserForDisplay,
  shouldHideUser,
} from 'src/modules/user'
import { recordAndReturnBetHistory } from 'src/modules/bet/documents/bet_history_mongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import {
  updateGame as updateProviderGame,
  getGame,
} from 'src/modules/tp-games/documents/games'
import { type BetHistory } from 'src/modules/bet/types'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'
import { getGameEdge } from 'src/modules/game'

import { touchAction } from '../../documents/actions'
import { updateGame, findGame } from '../../documents/games'
import { checkPreconditions, getUserBalance } from '../util'
import { getDisplayCurrencyFromRequest, parseSoftswissId } from '../currencies'
import { processWinAction } from './win'
import { processBetAction } from './bet'
import { getErrorStatusCode, type StatusCode } from '../error'
import { softswissLogger } from '../logger'

export interface Action {
  action: 'bet' | 'win'
  amount: number
  action_id: string
  jackpot_contribution?: number
  jackpot_win?: number
}

export interface PlayRequest {
  game_id: string
  user_id: string
  game: string
  actions: Action[]
  finished: boolean
  currency: string
}

export interface Transaction {
  action_id: string
  tx_id?: string // TODO This should not be optional but we can't guarantee we are creating it
  processed_at?: string // This is not optional in API docs, but we don't supply it
  bonus_amount?: number
}

export type SoftswissResponse<B extends object> = {
  body: B
} & StatusCode

export interface PlayResponse {
  balance: number
  game_id: string
  transactions: Transaction[]
}

/**
 * @todo break apart this file: separate the responsibilities of looping through the actions to play from processing an action.
 * i.e. transport layer distinct from application layer
 */
export async function play(
  request: PlayRequest,
): Promise<SoftswissResponse<PlayResponse>> {
  const userId = parseSoftswissId(request.user_id)
  if (!userId) {
    const statusCode = getErrorStatusCode('player deleted')
    return {
      body: { balance: 0, game_id: request.game_id, transactions: [] },
      ...statusCode,
    }
  }

  const logger = softswissLogger('play', { userId })

  const displayCurrency = getDisplayCurrencyFromRequest(request)
  if (!displayCurrency) {
    const statusCode = getErrorStatusCode('invalid currency')
    logger.error('error [currency]')
    return {
      body: { balance: 0, game_id: request.game_id, transactions: [] },
      ...statusCode,
    }
  }

  try {
    const processedActions = await processPlayActions(
      request,
      userId,
      displayCurrency,
    )
    const userBalance = await getUserBalance(
      { user_id: userId },
      displayCurrency,
    )

    return {
      body: {
        balance: userBalance,
        transactions: processedActions?.transactions,
        game_id: request.game_id,
      },
      status: 200,
      code: 0,
    }
  } catch (error) {
    logger.error('error', request, error)
    const status = getErrorStatusCode(error)
    const userBalance = await getUserBalance(
      { user_id: userId },
      displayCurrency,
    )

    return {
      body: {
        balance: userBalance,
        game_id: request.game_id,
        transactions: [],
      },
      ...status,
    }
  }
}

export async function processPlayActions(
  request: PlayRequest,
  userId: string,
  displayCurrency: DisplayCurrency,
): Promise<{ transactions: Transaction[] }> {
  const logger = softswissLogger('processPlayActions', { userId })
  const transactions: Transaction[] = []
  const user = await getUserById(userId)
  if (!user) {
    logger.error('no user', { game: request.game, request })
    throw 'player deleted'
  }

  const betId = 'SWS-' + request.game_id

  if (request.actions) {
    const { success, reason } = await checkPreconditions(request, user)
    if (!success) {
      throw reason
    }

    // TODO convert loop body to function
    for (const action of request.actions) {
      if (action.amount) {
        action.amount = action.amount / 100
      }

      const { action: internalAction, existed } = await touchAction(
        action.action_id,
        { ...action, userId, game: request.game, game_id: request.game_id },
      )

      if (!internalAction) {
        // undefined behavior
        continue
      }

      if (existed) {
        transactions.push({
          action_id: internalAction.action_id,
          tx_id: internalAction._id.toString(),
        })
        continue
      }

      const actionMap = {
        bet: processBetAction,
        win: processWinAction,
      } as const

      await actionMap[action.action](request, action, user, betId)

      transactions.push({
        action_id: action.action_id,
        tx_id: internalAction._id.toString(),
      })
    }
  }

  if (request.finished) {
    const alreadyGame = await findGame({ game_id: request.game_id })
    if (alreadyGame && alreadyGame.finished) {
      return { transactions }
    }
  }

  try {
    if (request.finished) {
      const game = await updateGame(
        { game_id: request.game_id },
        { finished: true },
      )

      const providerGame = (await getGame({ identifier: request.game })) ?? {
        title: 'Unknown Game',
        category: 'Unknown',
        payout: 99,
      }

      if (!('_id' in providerGame)) {
        logger.error('Invalid SWS game', { request })
      }

      const incognito = await shouldHideUser(user)

      if (!game.betAmount) {
        throw 'No game.betAmount'
      }
      const betAmountUSD = await currencyExchange(
        game?.betAmount ?? 0,
        displayCurrency,
      )
      const payAmountUSD = await currencyExchange(
        game?.payAmount ?? 0,
        displayCurrency,
      )

      const bet: BetHistory = {
        thirdParty: 'softswiss',
        betAmount: betAmountUSD,
        won: game.payAmount > 0,
        gameSessionId: game.game_id,
        gameIdentifier: request.game,
        payoutValue: payAmountUSD,
        // @ts-expect-error We are ok with this being like this - but this is wrong
        gameName: 'softswiss',
        category: providerGame.category,
        profit: payAmountUSD - betAmountUSD,
        balanceType: game.balanceType,
        user: !incognito ? await getUserForDisplay(user) : null,
        userId: user.id,
        betId,
        timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
        gameNameDisplay: providerGame.title,
        incognito,
        twoFactor: !!(user.twofactorEnabled || user.emailVerified),
        transactionIds: transactions
          .map(({ tx_id }) => tx_id)
          .filter((tx_id): tx_id is string => !!tx_id),
      }

      updateProviderGame(
        {
          identifier: request.game,
        },
        {
          $inc: {
            popularity: game.betAmount,
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
  } catch (error) {
    logger.error('Finished Error', { request }, error)
  }

  return { transactions }
}
