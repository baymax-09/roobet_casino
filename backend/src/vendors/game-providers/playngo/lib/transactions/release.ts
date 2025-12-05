import { r } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import {
  getUserById,
  getUserForDisplay,
  userIsLocked,
  shouldHideUser,
} from 'src/modules/user'
import {
  creditBalance,
  getBalanceFromUserAndType,
} from 'src/modules/user/balance'
import { recordAndReturnBetHistory } from 'src/modules/bet/documents/bet_history_mongo'
import { afterBetHooks } from 'src/modules/bet/lib/hooks'
import {
  type TPGame,
  updateGame as updateProviderGame,
} from 'src/modules/tp-games/documents/games'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { type BetHistory } from 'src/modules/bet/types'
import { getGameEdge } from 'src/modules/game'
import { preventOverMaxPayout } from 'src/modules/bet/util'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { type PNGGameRound } from '../../documents/game-rounds'
import { finishGameSession, updateGameRound } from '../../documents/game-rounds'
import { type SessionState, StatusCodes } from '../enums'
import { convertBalance } from '../utils'
import { getDisplayCurrencyFromRequest } from '../currencies'
import { getBetIdFromRequest } from './reserve'
import { fetchPlayngoGame } from '../games'
import { type PngResponse } from '../../documents/transactions'
import { playngoLogger } from '../logger'

interface ReleaseRequest {
  real: string
  gameid: string
  roundid: string // ?
  gamesessionid: string
  state: SessionState
  transactionid: string // is this true?
  currency: string
}

async function finishGame(
  user: UserTypes.User,
  gameSession: PNGGameRound,
  request: ReleaseRequest,
  providerGame: TPGame | null,
) {
  const logger = playngoLogger('finishGame', { userId: user.id })
  const betId = getBetIdFromRequest(request)

  if (!providerGame) {
    logger.error('finishGame error - no providerGame with identifier', {
      gameid: request.gameid,
    })
    return
  }

  const incognito = await shouldHideUser(user)

  if (!gameSession) {
    logger.error('finishGame stopping - no gameSession')
    return
  }

  if (request.roundid === '0') {
    logger.error('received summary release request - not recording bet')
    return
  }

  if (!gameSession.betAmount) {
    logger.error(
      'finishGame stopping - not recording bet because no bet amount',
    )
    return
  }
  const displayCurrency = getDisplayCurrencyFromRequest(request)

  if (!displayCurrency) {
    logger.error('finishGame stopping[currency]', {
      gameSessionId: gameSession.gameSessionId,
      currency: request.currency,
    })
    return
  }

  const payAmount = gameSession.payAmount || 0
  const payAmountUSD = await currencyExchange(payAmount, displayCurrency)
  const betAmount = gameSession.betAmount || 0
  const betAmountUSD = await currencyExchange(betAmount, displayCurrency)

  const bet: BetHistory = {
    thirdParty: 'playngo',
    betAmount: betAmountUSD,
    gameSessionId: gameSession.gameSessionId,
    won: payAmount > 0,
    gameIdentifier: providerGame.identifier,
    payoutValue: payAmountUSD,
    // @ts-expect-error we know this is broken - lets fix this soon
    gameName: 'playngo',
    profit: payAmountUSD - betAmountUSD,
    user: !incognito ? await getUserForDisplay(user) : null,
    userId: user.id,
    betId,
    timestamp: r.now(), // TODO don't do this, this value gets used in afterbethooks
    gameNameDisplay: providerGame.title,
    category: providerGame.category,
    incognito,
    twoFactor: !!(user.twofactorEnabled || user.emailVerified),
    balanceType: gameSession.balanceType,
  }

  updateProviderGame(
    { identifier: providerGame.identifier },
    { $inc: { popularity: gameSession.betAmount } },
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

export async function processRelease(
  user: UserTypes.User,
  request: ReleaseRequest,
): Promise<PngResponse> {
  const logger = playngoLogger('processRelease', { userId: user.id })
  if (await userIsLocked(user)) {
    return {
      statusCode: StatusCodes.ACCOUNTLOCKED,
    }
  }
  const { real } = request
  const amount = parseFloat(real) || 0
  const releaseCurrency = getDisplayCurrencyFromRequest(request)
  if (!releaseCurrency) {
    logger.error('processRelease stopping[currency]', {
      roundId: request.roundid,
      currency: request.currency,
    })
    return {
      statusCode: StatusCodes.INVALIDCURRENCY,
    }
  }

  let gameSession = await updateGameRound(
    { roundId: request.roundid },
    {
      $inc: { payAmount: amount },
      gameSessionId: request.gamesessionid,
      gameId: request.gameid,
      userId: user.id,
    },
  )

  if (!gameSession) {
    const response = {
      externalTransactionId: '',
      statusCode: StatusCodes.OK,
    }
    return response
  }

  if (request.state == 1) {
    logger.info('finishing game session', {
      gamesessionid: request.gamesessionid,
    })
    await finishGameSession(request.gamesessionid)
  }

  // If this is a new game session store the balance type/field.
  if (!gameSession.balanceType) {
    gameSession = await updateGameRound(
      { roundId: request.roundid },
      { balanceType: user.selectedBalanceType, currency: releaseCurrency },
    )
  }

  const providerGame = await fetchPlayngoGame(request.gameid)

  const transMeta: TransactionMeta['payout'] = {
    provider: 'playngo',
    gameSessionId: gameSession.gameSessionId,
    betId: getBetIdFromRequest(request),
    gameIdentifiers: { identifier: providerGame?.identifier },
  }

  const releaseAmountUSD = await currencyExchange(amount, releaseCurrency)
  logger.debug('conversion info', {
    transMeta,
    amount,
    releaseCurrency,
    real,
    releaseAmountUSD,
  })

  const overMaxPayout = await preventOverMaxPayout(
    user.id,
    releaseAmountUSD,
    `${providerGame?.identifier.toString()}`,
  )
  if (!overMaxPayout) {
    await creditBalance({
      user,
      amount: releaseAmountUSD,
      transactionType: 'payout',
      meta: transMeta,
      balanceTypeOverride: gameSession.balanceType,
    })
  }

  await finishGame(user, gameSession, request, providerGame)

  const newUser = await getUserById(user.id)

  if (!newUser) {
    return {
      statusCode: StatusCodes.ACCOUNTLOCKED,
    }
  }
  const balanceReturn = await getBalanceFromUserAndType({
    user: newUser,
    balanceType: gameSession.balanceType,
  })
  const displayBalance = await currencyExchange(
    balanceReturn.balance,
    releaseCurrency,
    true,
  )

  const response = {
    real: convertBalance(displayBalance),
    statusCode: StatusCodes.OK,
  }
  return response
}
