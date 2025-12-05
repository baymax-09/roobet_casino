import { v1 as uuidv1 } from 'uuid'

import { config } from 'src/system'
import { type Types as BetTypes } from 'src/modules/bet'
import { placeBet, prepareAndCloseoutActiveBet } from 'src/modules/bet'
import { getActiveBetById } from 'src/modules/bet/documents/active_bet'
import { buildGroup } from 'src/modules/game/lib/shuffle'
import { type Types as UserTypes } from 'src/modules/user'
import {
  clearActiveGame,
  getActiveGameByUser,
  clearUserActiveGames,
  createActiveGame,
  markCardAsPlayed,
} from 'src/modules/game/documents/active_game'
import { startNewRound } from 'src/modules/game/lib/round'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { APIValidationError } from 'src/util/errors'
import { type ActiveBet, type BetHistory } from 'src/modules/bet/types'

import { insertMinesHistory } from '../documents/mines_history'
import { type MinesRound } from '../documents/mines_round'
import { MinesRoundModel } from '../documents/mines_round'
import {
  type ActiveMinesGame,
  type MinesDeck,
  currentMinesIndex,
  isMinesIndex,
  isMinesCard,
} from '../documents/active_mines_games'
import { ActiveMinesGames } from '../documents/active_mines_games'
import {
  getDiamondCount,
  getPlayedMinesCount,
  getPayoutMultiplier,
} from './payout'
import { scopedLogger } from 'src/system/logger'

const minesLogger = scopedLogger('mines')

const maxPayout = config.bet.maxProfit

interface GameboardSettings {
  maxPayout: number
  maxBet: number
  edge: number
}

export const getGameboardSettings = (): GameboardSettings => {
  const edge = config.mines.edge
  const maxBet = config.mines.maxBet

  return {
    maxPayout,
    maxBet,
    edge,
  }
}

export async function getActiveMinesGame(user: UserTypes.User) {
  const activeGame = await getActiveGameByUser<ActiveMinesGame>(
    ActiveMinesGames,
    user.id,
  )

  const currentRound = await getCurrentRoundForUser<MinesRound>(
    user,
    'mines',
    MinesRoundModel,
  )

  if (!activeGame || !activeGame.bet) {
    throw new APIValidationError('no__active_game')
  }

  const gridCount = activeGame.gridCount ?? 25
  const activeDeck = activeGame.played
  const multiplier = getPayoutMultiplier(activeGame)

  const bet = await getActiveBetById(activeGame.bet)
  if (!currentRound || !bet) {
    await clearUserActiveGames(ActiveMinesGames, user.id)
    throw new APIValidationError('no__round')
  }

  const minesIndex = currentMinesIndex(gridCount)

  const playedCards = {}
  for (let index = 0; index < gridCount; index++) {
    const cardIndex = minesIndex[index]
    if (activeDeck[cardIndex] === 'diamond') {
      // @ts-expect-error number indexing POJO
      playedCards[index] = 'played'
    }
  }

  return {
    activeGameId: activeGame.id,
    minesCount: activeGame.minesCount,
    gridCount,
    bet,
    provablyFairInfo: currentRound,
    playedCards,
    multiplier,
  }
}

export function setOrderedGroup(
  minesCount: number,
  shuffledGroup: number[],
  gridCount: number,
): MinesDeck {
  const orderedGroup = {}

  if (minesCount < 1) {
    minesCount = 1
  }

  if (minesCount > 24 && gridCount === 25) {
    minesCount = 24
  }

  if (minesCount > 35 && gridCount === 36) {
    minesCount = 35
  }

  if (minesCount > 48 && gridCount === 49) {
    minesCount = 48
  }

  if (minesCount > 63 && gridCount === 64) {
    minesCount = 63
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

  // @ts-expect-error incrementally adding fields to object above
  return orderedGroup
}

export async function startMines(
  user: UserTypes.User,
  betAmount: number,
  minesCount: number,
  clientSeed: string,
  freeBetItemId: string,
  gridCount: number,
) {
  // Block multiple games from being created.
  const activeGame = await getActiveGameByUser<ActiveMinesGame>(
    ActiveMinesGames,
    user.id,
  )

  if (activeGame) {
    throw new APIValidationError('mines__active_game')
  }

  // Hash should NEVER be returned.
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    'mines',
    clientSeed,
  )
  const difficulty = minesCount
  const shuffledGroup: number[] = buildGroup(gridCount, hash)
  const orderedGroup = setOrderedGroup(difficulty, shuffledGroup, gridCount)
  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound.id,
    roundHash: provablyFairInfo.currentRound.hash,
    nonce: provablyFairInfo.currentRound.nonce,
    minesCount: difficulty,
    gridCount,
  }

  const bet = await placeBet({
    user,
    game: {
      id: uuidv1(),
      gameName: 'mines',
    },
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  const extraActiveGameParams = {
    bet: bet.id,
    minesCount: difficulty,
    gridCount,
  }
  const activeGameId: string = await createActiveGame(
    ActiveMinesGames,
    user.id,
    orderedGroup,
    extraActiveGameParams,
  )
  return { activeGameId, bet, provablyFairInfo }
}

// Update bet, update deck of cards, and update the payout multiplier.
export async function selectCard(
  activeGameId: string,
  selectedCard: number,
  user: UserTypes.User,
) {
  const activeGame = await getActiveGameByUser<ActiveMinesGame>(
    ActiveMinesGames,
    user.id,
  )

  if (!activeGame || activeGame.id !== activeGameId || !activeGame.bet) {
    throw new APIValidationError('no__active_game')
  }

  const gridCount = activeGame.gridCount ?? 25

  const bet = await getActiveBetById(activeGame.bet)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }

  const selectedCardStr = selectedCard.toString()
  if (!isMinesIndex(selectedCardStr, gridCount)) {
    throw new APIValidationError('mines__card_select')
  }

  const cardType = activeGame.deck[selectedCardStr]

  if (!isMinesCard(cardType)) {
    throw new APIValidationError('mines__card_select')
  }

  const updatedActiveGame = await markCardAsPlayed<ActiveMinesGame>(
    ActiveMinesGames,
    activeGameId,
    selectedCard,
    cardType,
  )

  if (!updatedActiveGame) {
    throw new APIValidationError('mines__card_select')
  }

  if (cardType === 'mine') {
    return await bombed(updatedActiveGame, bet)
  }

  const maxDiamondCount = gridCount - updatedActiveGame.minesCount
  // @ts-expect-error TODO something is wrong really need to fix
  const lostGameResult = await checkIfGameIsBombed(updatedActiveGame)
  if (lostGameResult) {
    return lostGameResult
  }

  const currentRound = await getCurrentRoundForUser<MinesRound>(
    user,
    'mines',
    MinesRoundModel,
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
      result: cardType,
      payoutMultiplier: multiplier,
      provablyFairInfo: currentRound,
    }
  }
}

// Update bet, update deck of cards, and update the payout multiplier.
export async function autoBetMines(
  user: UserTypes.User,
  selectedCards: number[],
  betAmount: number,
  clientSeed: string,
  freeBetItemId: string,
  minesCount: number,
  gridCount: number,
) {
  // Block multiple games from being created.
  const activeGame = await getActiveGameByUser<ActiveMinesGame>(
    ActiveMinesGames,
    user.id,
  )

  if (activeGame) {
    throw new APIValidationError('mines__active_game')
  }

  // Hash should NEVER be returned.
  const { hash, provablyFairInfo } = await startNewRound(
    user,
    'mines',
    clientSeed,
  )
  const difficulty = minesCount
  const shuffledGroup: number[] = buildGroup(gridCount, hash)
  const orderedGroup = setOrderedGroup(difficulty, shuffledGroup, gridCount)
  const extraBetFields = {
    clientSeed,
    roundId: provablyFairInfo.currentRound.id,
    roundHash: provablyFairInfo.currentRound.hash,
    nonce: provablyFairInfo.currentRound.nonce,
    minesCount: difficulty,
    gridCount,
  }

  const bet = await placeBet({
    user,
    game: {
      id: uuidv1(),
      gameName: 'mines',
    },
    betAmount,
    extraBetFields,
    freeBetItemId,
  })

  const playedCards: Partial<MinesDeck> = {}
  for (const selectedCard of selectedCards) {
    const selectedCardStr = selectedCard.toString()
    if (!isMinesIndex(selectedCardStr, gridCount)) {
      throw new APIValidationError('mines__card_select')
    }

    const cardType = orderedGroup[selectedCardStr]
    if (!isMinesCard(cardType)) {
      throw new APIValidationError('mines__card_select')
    }

    playedCards[selectedCardStr] = cardType
  }

  const updatedActiveGame = {
    deck: orderedGroup,
    minesCount: difficulty,
    played: playedCards,
    userId: user.id,
    gridCount,
  }

  const bombed = Object.values(playedCards).includes('mine')

  const multiplier = bombed ? 0 : getPayoutMultiplier(updatedActiveGame)

  await insertMinesHistory(updatedActiveGame)

  let returnBet: ActiveBet | BetHistory = {
    ...bet,
    payoutMultiplier: multiplier,
    payoutValue: Math.min(bet.betAmount * multiplier, maxPayout),
  }

  try {
    returnBet = await prepareAndCloseoutActiveBet(returnBet)
  } catch (error) {
    minesLogger('autoBetMines', { userId: bet.userId }).error(
      `Failed to close out bet: ${bet} - ${error.message}`,
      { bet },
      error,
    )
  }

  return {
    deck: updatedActiveGame.deck,
    bet: {
      ...returnBet,
      closeoutTimestamp: null,
    },
  }
}

async function bombed(activeGame: ActiveMinesGame, bet: BetTypes.ActiveBet) {
  bet.payoutValue = 0
  await endMines(activeGame)
  const closedoutBet = await prepareAndCloseoutActiveBet(bet)

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
  activeGame: ActiveMinesGame,
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

  await endMines(activeGame)

  let returnBet: ActiveBet | BetHistory = {
    ...bet,
    payoutMultiplier: multiplier,
    payoutValue: Math.min(bet.betAmount * multiplier, maxPayout),
  }

  try {
    returnBet = await prepareAndCloseoutActiveBet(returnBet)
  } catch (error) {
    minesLogger('autoBetMines', { userId: bet.userId }).error(
      `Failed to close out bet: ${bet} - ${error.message}`,
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
  const activeGame = await getActiveGameByUser<ActiveMinesGame>(
    ActiveMinesGames,
    user.id,
  )
  if (!activeGame || !activeGame.bet) {
    throw new APIValidationError('no__active_game')
  }

  const bet = await getActiveBetById(activeGame.bet)
  if (!bet) {
    throw new APIValidationError('bet__not_found')
  }

  return await closeOutGame(activeGame, bet)
}

async function endMines(activeGame: ActiveMinesGame) {
  await clearActiveGame(ActiveMinesGames, activeGame.id)
  await insertMinesHistory(activeGame)
}

async function checkIfGameIsBombed(
  activeGame: ActiveMinesGame,
  bet: BetTypes.ActiveBet,
) {
  const minesCount = getPlayedMinesCount(activeGame)

  if (minesCount > 0) {
    return await bombed(activeGame, bet)
  }
}
