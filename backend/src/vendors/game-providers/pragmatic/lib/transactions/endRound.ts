import { r } from 'src/system'
import {
  type Types as UserTypes,
  getUserForDisplay,
  shouldHideUser,
} from 'src/modules/user'
import { recordAndReturnBetHistory } from 'src/modules/bet/documents/bet_history_mongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import {
  updateGame as updateProviderGame,
  getGame as getProviderGame,
} from 'src/modules/tp-games/documents/games'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'
import { type BetHistory } from 'src/modules/bet/types'
import { getGameEdge } from 'src/modules/game'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { type PragmaticGameRound } from '../../documents/game-rounds'
import { updateGameRound } from '../../documents/game-rounds'
import { convertBalance } from '../utils'
import { getIdentifierForGameId } from '../games'
import { makeSuccessResponse } from '../api'
import { type ProcessResult } from '../types'
import { pragmaticLogger } from '../logger'

interface EndRoundRequest {
  gameId: string
  roundId: string
}

export interface EndRoundRespFields {
  cash: number
  bonus: number
}

type EndRoundResponse = ProcessResult<EndRoundRespFields>

export async function processEndRound(
  user: UserTypes.User,
  request: EndRoundRequest,
  requestCurrency: DisplayCurrency,
): Promise<EndRoundResponse> {
  const { roundId } = request
  const gameSession = await updateGameRound(
    { gameSessionId: roundId },
    { finished: true },
  )

  await finishGame(user, gameSession, request)
  const balanceReturn = await getBalanceFromUserAndType({
    user,
    balanceType: gameSession.balanceType,
  })
  const displayBalance = await currencyExchange(
    balanceReturn.balance,
    requestCurrency,
    true,
  )
  const response = makeSuccessResponse({
    cash: convertBalance(displayBalance),
    bonus: 0,
  })
  return response
}

async function finishGame(
  user: UserTypes.User,
  gameSession: PragmaticGameRound,
  request: EndRoundRequest,
) {
  const logger = pragmaticLogger('finishGame', { userId: user.id })
  const identifier = getIdentifierForGameId(request.gameId)
  const providerGame = (await getProviderGame({ identifier })) || {
    title: 'Pragmatic Game',
    category: 'Unknown',
    payout: 99,
  }
  const incognito = await shouldHideUser(user)

  if (!gameSession) {
    logger.info('finishGame stopping - no gameSession')
    return
  }

  // TODO the other providers return if this is the case, should we do that here?
  if (!providerGame) {
    logger.error('no providerGame with identifier', { identifier })
  }
  const betAmountUSD = await currencyExchange(
    gameSession?.betAmount ?? 0,
    gameSession.currency,
  )
  const payAmountUSD = await currencyExchange(
    gameSession?.payAmount ?? 0,
    gameSession.currency,
  )

  const bet: BetHistory = {
    thirdParty: 'pragmatic',
    betAmount: betAmountUSD,
    gameSessionId: gameSession.gameSessionId,
    won: gameSession.payAmount > 0,
    gameIdentifier: identifier,
    payoutValue: payAmountUSD,
    // @ts-expect-error We are ok with this being like this - but this is wrong
    gameName: 'pragmatic',
    profit: payAmountUSD - betAmountUSD,
    balanceType: gameSession.balanceType,
    user: !incognito ? await getUserForDisplay(user) : null,
    userId: user.id,
    betId: request.roundId,
    timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
    gameNameDisplay: providerGame.title,
    category: providerGame.category,
    incognito,
    twoFactor: user.twofactorEnabled || user.emailVerified,
  }

  updateProviderGame(
    { identifier },
    {
      $inc: {
        popularity: gameSession.betAmount || 0,
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
