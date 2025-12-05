import { config } from 'src/system'
import { type Types as BetTypes } from 'src/modules/bet'
import { placeBet, prepareAndCloseoutActiveBet } from 'src/modules/bet'
import { getActiveBetById } from 'src/modules/bet/documents/active_bet'
import { buildGroup } from 'src/modules/game/lib/shuffle'
import { type Types as UserTypes } from 'src/modules/user'

import { startNewRound } from 'src/modules/game/lib/round'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { APIValidationError } from 'src/util/errors'

import { newLinearMinesGame } from './game'
import { insertLinearMinesHistory } from '../documents/linear_mines_history'
import {
  type LinearMinesRound,
  LinearMinesRoundModel,
} from '../documents/linear_mines_round'
import {
  clearUserActiveGames,
  getLinearMinesActiveGamesForUser,
  insertLinearMinesActiveGame,
  isLinearMinesCard,
  markCardAsPlayed,
  type ActiveLinearMinesGame,
  type LinearMinesDeck,
} from '../documents/active_linear_mines_games'
import {
  getDiamondCount,
  getPlayedMinesCount,
  getPayoutMultiplier,
} from './payout'
import { type PlayedMinesCards } from 'src/modules/mines/documents/active_mines_games'
import { type ActiveBet, type BetHistory } from 'src/modules/bet/types'
import { scopedLogger } from 'src/system/logger'

const linearMinesLogger = scopedLogger('linearmines')

export const GROUP_SIZE = 25
const maxPayout = config.bet.maxProfit
const gameNameDisplay = 'Mission Uncrossable'

interface GameboardSettings {
  maxPayout: number
  maxBet: number
  edge: number
}

export const getGameboardSettings = (): GameboardSettings => {
  const edge = config.linearmines.edge
  const maxBet = config.linearmines.maxBet

  return {
    maxPayout,
    maxBet,
    edge,
  }
}

export async function getActiveLinearMinesGame(user: UserTypes.User) {
  const activeGames = await getLinearMinesActiveGamesForUser({
    userId: user.id,
  })
  if (!activeGames || activeGames.length < 1) {
    throw new APIValidationError('no__active_game')
  }
  const activeGame = activeGames[0]
  const currentRound = await getCurrentRoundForUser<LinearMinesRound>(
    user,
    'linearmines',
    LinearMinesRoundModel,
  )

  if (!activeGame || !activeGame.bet) {
    throw new APIValidationError('no__active_game')
  }

  const activeDeck = activeGame.played
  const multiplier = getPayoutMultiplier(activeGame)

  const bet = await getActiveBetById(activeGame.bet)
  if (!currentRound || !bet) {
    await clearUserActiveGames(user.id)
    throw new APIValidationError('no__round')
  }

  const playedCards: PlayedMinesCards = {}

  for (let index = 0; index < GROUP_SIZE; index++) {
    if (activeDeck[index] === 'diamond') {
      // @ts-expect-error number indexing POJO
      playedCards[index] = 'played'
    }
  }

  return {
    activeGameId: activeGame._id.toString(),
    minesCount: activeGame.minesCount,
    bet,
    provablyFairInfo: currentRound,
    playedCards,
    multiplier,
  }
}

export function setOrderedGroup(
  minesCount: number,
  shuffledGroup: number[],
): LinearMinesDeck {
  const orderedGroup = {}

  if (minesCount < 1) {
    minesCount = 1
  }

  if (minesCount > 24) {
    minesCount = 24
  }

  shuffledGroup.forEach((card, index) => {
    if (index < minesCount) {
      // @ts-expect-error number indexing POJO
      orderedGroup[card] = 'mine'
    }

    if (index >= minesCount) {
      // @ts-expect-error number indexing POJO
      orderedGroup[card] = 'diamond'
    }
  })

  return orderedGroup
}

export async function startLinearMines(
  user: UserTypes.User,
  betAmount: number,
  minesCount: number,
  clientSeed: string,
  freeBetItemId: string,
) {
  // Block multiple games from being created.
  const activeGames = await getLinearMinesActiveGamesForUser({
    userId: user.id,
  })
  if (!!activeGames && activeGames.length > 0) {
    throw new APIValidationError('mines__active_game')
    /*
     * await clearUserActiveGames(ActiveMinesGames, activeGame.userId);
     * await insertMinesHistory(activeGame)
     */
  }

  // Hash should NEVER be returned.
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    'linearmines',
    clientSeed,
  )
  const difficulty = minesCount
  const shuffledGroup: number[] = buildGroup(GROUP_SIZE, hash)
  const orderedGroup = setOrderedGroup(difficulty, shuffledGroup)
  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound.id,
    roundHash: provablyFairInfo.currentRound.hash,
    nonce: provablyFairInfo.currentRound.nonce,
    minesCount: difficulty,
  }

  const bet = await placeBet({
    user,
    game: newLinearMinesGame(),
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  const newActiveGame = await insertLinearMinesActiveGame({
    userId: user.id,
    bet: bet.id,
    deck: orderedGroup,
    minesCount: difficulty,
    played: {},
  })
  const newActiveGameId = newActiveGame.id
  return { newActiveGameId, bet, provablyFairInfo }
}

// Update bet, update deck of cards, and update the payout multiplier.
export async function selectCard(
  activeGameId: string,
  selectedCard: number,
  user: UserTypes.User,
) {
  const activeGames = await getLinearMinesActiveGamesForUser({
    userId: user.id,
  })
  if (!activeGames || activeGames.length < 1) {
    throw new APIValidationError('no__active_game')
  }
  const activeGame = activeGames[0]

  if (
    !activeGame ||
    activeGame._id.toString() !== activeGameId ||
    !activeGame.bet
  ) {
    throw new APIValidationError('no__active_game')
  }

  const bet = await getActiveBetById(activeGame.bet)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }

  const card = activeGame.deck[selectedCard]

  if (!isLinearMinesCard(card)) {
    throw new APIValidationError('mines__card_select')
  }

  const updatedActiveGame = await markCardAsPlayed(
    activeGame,
    selectedCard,
    card,
  )

  if (!updatedActiveGame) {
    throw new APIValidationError('mines__card_select')
  }

  if (card === 'mine') {
    return await bombed(updatedActiveGame, bet)
  }

  const maxDiamondCount = GROUP_SIZE - updatedActiveGame.minesCount
  // @ts-expect-error TODO something is wrong really need to fix
  const lostGameResult = await checkIfGameIsBombed(updatedActiveGame)
  if (lostGameResult) {
    return lostGameResult
  }

  const currentRound = await getCurrentRoundForUser<LinearMinesRound>(
    user,
    'linearmines',
    LinearMinesRoundModel,
  )
  const multiplier = getPayoutMultiplier(updatedActiveGame)
  const diamondCount = getDiamondCount(updatedActiveGame)

  if (
    bet.betAmount * multiplier > maxPayout ||
    diamondCount >= maxDiamondCount
  ) {
    return await closeOutGame(updatedActiveGame, bet)
  } else {
    return {
      result: card,
      payoutMultiplier: multiplier,
      provablyFairInfo: currentRound,
    }
  }
}

async function bombed(
  activeGame: ActiveLinearMinesGame,
  bet: BetTypes.ActiveBet,
) {
  bet.payoutValue = 0
  await endLinearMines(activeGame)

  const formattedBet: BetTypes.ActiveBet = {
    ...bet,
    gameNameDisplay,
  }

  const closedoutBet = await prepareAndCloseoutActiveBet(formattedBet)

  const multiplier = getPayoutMultiplier(activeGame)

  return {
    deck: activeGame.deck,
    bet: {
      ...closedoutBet,
      closeoutTimestamp: null,
    },
    payoutMultiplier: multiplier,
  }
}

async function closeOutGame(
  activeGame: ActiveLinearMinesGame,
  bet: BetTypes.ActiveBet,
) {
  // @ts-expect-error TODO something is wrong really need to fix
  const lostGameResult = await checkIfGameIsBombed(activeGame)
  if (lostGameResult) {
    return lostGameResult
  }

  const played = Object.values(activeGame.played || {})

  if (!played.includes('diamond')) {
    throw new APIValidationError('no__tile')
  }

  const multiplier = getPayoutMultiplier(activeGame)

  await endLinearMines(activeGame)

  let returnBet: ActiveBet | BetHistory = {
    ...bet,
    gameNameDisplay,
    payoutMultiplier: multiplier,
    payoutValue: Math.min(bet.betAmount * multiplier, maxPayout),
  }

  try {
    returnBet = await prepareAndCloseoutActiveBet(returnBet)
  } catch (error) {
    linearMinesLogger('closeOutGame/prepareAndCloseoutActiveBet', {
      userId: bet.userId,
    }).error(
      `failed to close out bet: ${bet} - ${error.message}`,
      { bet },
      error,
    )
  }

  return {
    deck: activeGame.deck,
    bet: {
      ...returnBet,
      closeoutTimestamp: null,
    },
  }
}

export async function cashoutByActiveGameId(user: UserTypes.User) {
  const activeGames = await getLinearMinesActiveGamesForUser({
    userId: user.id,
  })
  if (!activeGames || activeGames.length < 1) {
    throw new APIValidationError('no__active_game')
  }
  const activeGame = activeGames[0]
  if (!activeGame || !activeGame.bet) {
    throw new APIValidationError('no__active_game')
  }

  const bet = await getActiveBetById(activeGame.bet)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }
  return await closeOutGame(activeGame, bet)
}

async function endLinearMines(activeGame: ActiveLinearMinesGame) {
  await clearUserActiveGames(activeGame.userId)
  await insertLinearMinesHistory(activeGame)
}

async function checkIfGameIsBombed(
  activeGame: ActiveLinearMinesGame,
  bet: BetTypes.ActiveBet,
) {
  const minesCount = getPlayedMinesCount(activeGame)

  if (minesCount > 0) {
    return await bombed(activeGame, bet)
  }
}
