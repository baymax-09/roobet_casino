import { translateWithLocale } from '../../../util/i18n'
import { type BetHistoryDocument } from '../../bet/types'
import { generateHmac } from '../../game/lib/provably_fair/sharedAlgorithms'
import * as pfUserGen from '../../game/lib/provably_fair/userGenerated'
import {
  isVerificationError,
  type GameRound,
  type VerificationError,
  type VerificationResults,
  type VerifyData,
} from '../../game/types'
import { type Types as UserTypes } from '../../user'
import * as userDoc from '../../user/documents/user'
import * as gameDoc from '../documents/blackjackGames'
import * as historyDoc from '../documents/blackjackHistory'
import { buildBasicDealtGameWithPlayerId, getObjectIdValue } from '../test'
import {
  CardSuitType,
  CardValueType,
  GameStatus,
  HandOutcomeType,
  HandStatusDefault,
  isDealerSeat,
  isHandActionWithShoe,
  isPlayerHand,
  isPlayerSeat,
  type DealerSeat,
  type GameState,
  type Table,
} from '../types'
import {
  BLACKJACK_GAME_NAME,
  DEALER_HOLE_INDEX,
  DEALER_ID,
} from '../types/constants'
import { createFinalHash } from './api'
import { getProvableShoe } from './shoe'
import { BlackjackVerificationErrors, verifyBlackjack } from './verify'

describe('Verify', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const { game, playerId, betId, playerRoundHashes } =
    buildBasicDealtGameWithPlayerId()
  const gameId = game.id
  const closedGame = completeGame(game)
  const openGame = { ...game }
  const cases = [
    {
      name: 'Verifies A Game As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: closedGame,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: false,
        verificationError: false,
      },
    },
    {
      name: 'Errors With Active Games As Expected',
      inputs: {
        betId,
        playerId,
        games: [openGame],
        playerRound: true,
        playerRoundHashes,
        history: closedGame,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_STILL_ACTIVE,
        verificationError: true,
      },
    },
    {
      name: 'Errors With Incomplete Games As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: openGame,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_INCOMPLETE,
        verificationError: true,
      },
    },
    {
      name: 'Errors Without A Game Hash As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: { ...closedGame, hash: '' },
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_MISSING_HASH,
        verificationError: true,
      },
    },
    {
      name: 'Errors Without Players As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: { ...closedGame, players: [] } as unknown as GameState,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_MISSING_USERS,
        verificationError: true,
      },
    },
    {
      name: 'Errors Without Requesting Player As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: {
          ...closedGame,
          players: [
            { ...closedGame.players[0], playerId: 'not the player' },
            closedGame.players[1],
          ],
        } as unknown as GameState,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_MISSING_USER_SEAT,
        verificationError: true,
      },
    },
    {
      name: 'Errors With Missing Player Round As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: false,
        playerRoundHashes,
        history: closedGame,
        roundPlayerId: playerId,
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_MISSING_USER_ROUNDS,
        verificationError: true,
      },
    },
    {
      name: 'Errors With Mismatched Player Round As Expected',
      inputs: {
        betId,
        playerId,
        games: [],
        playerRound: true,
        playerRoundHashes,
        history: closedGame,
        roundPlayerId: getObjectIdValue(),
        verifyData: getVerifyData(gameId, playerId, betId),
      },
      expects: {
        throws: BlackjackVerificationErrors.GAME_MISSING_USER_ROUND,
        verificationError: true,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const {
      games,
      history,
      verifyData,
      playerRoundHashes,
      playerRound,
      roundPlayerId,
    } = inputs
    const { throws, verificationError } = expects
    const localeHeaders = ['en']

    jest.spyOn(gameDoc, 'getGamesForPlayer').mockResolvedValue(games)
    jest.spyOn(historyDoc, 'getHistoryByBetId').mockResolvedValue(history)
    jest
      .spyOn(userDoc, 'getUserById')
      .mockResolvedValue({ id: playerId } as unknown as UserTypes.User)
    jest.spyOn(pfUserGen, 'getCurrentRoundForUser').mockResolvedValue(
      (playerRound === false
        ? undefined
        : {
            id: gameId,
            userId: roundPlayerId,
            hash: playerRoundHashes[0],
            nonce: 0,
          }) as unknown as GameRound,
    )

    let result: VerificationResults | VerificationError | undefined
    if (throws !== false && typeof throws === 'object') {
      await expect(
        verifyBlackjack(verifyData).then(res => {
          result = res
          return res
        }),
      ).resolves.toBe(throws)
      expect(result).toBeDefined()
      expect(isVerificationError(result)).toBe(verificationError)

      if (isVerificationError(result)) {
        const translation = translateWithLocale(localeHeaders, result.message)
        expect(translation).not.toContain('blackjack__')
        expect(translation.endsWith('.')).toBe(true)
      }
    } else {
      await expect(
        verifyBlackjack(verifyData).then(res => {
          result = res
        }),
      ).resolves.not.toThrow()
      expect(result).toBeDefined()
      expect(isVerificationError(result)).toBe(verificationError)

      if (!!result && !isVerificationError(result)) {
        const gameRoundHash = playerRoundHashes.reduce(
          (pre, cur) => generateHmac(pre, cur),
          result.serverSeed,
        )
        expect(gameRoundHash).toBe(result.hashedServerSeed)
        expect(result.hashedServerSeed).toBe(history.hash)

        const revivedShoe = getProvableShoe(gameRoundHash)
        const historyShoe = getProvableShoe(history.hash!)
        expect(revivedShoe).toEqual(historyShoe)
      }
    }
  })
})

describe('Verify Action String Parsing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      inputs: {
        actionString:
          'P0H0A01707151557205S0A01707151557205S1A11707151568502S4A11707151578713S6A21707151600240D0H0A01707151557205S2A01707151557205S3A11707151568503S5A21707151578713',
      },
      expects: {
        actionCount: 9,
        lastShoeIndex: 6,
      },
    },
    {
      inputs: {
        actionString:
          'P0H0A01707151557205S0A01707151557205S1A11707151568502S4A11707151578713S10A21707151600240D0H0A01707151557205S2A01707151557205S3A11707151568503S5A21707151578713',
      },
      expects: {
        actionCount: 9,
        lastShoeIndex: 10,
      },
    },
  ].map((cse, ndx) => ({
    name: `Case ${ndx + 1} - ${cse.expects.actionCount}:${
      cse.expects.lastShoeIndex
    }`,
    ...cse,
  }))

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { actionString } = inputs
    const { actionCount, lastShoeIndex } = expects
    const decodedActions = decodeActions(actionString)
    expect(decodedActions).not.toBeInstanceOf(String)
    expect(decodedActions).toHaveLength(3)
    expect(decodedActions[0]).toHaveLength(2)
    expect(decodedActions[1]).toBe(lastShoeIndex)
    expect(decodedActions[2]).toBe(actionCount)
  })
})

describe('Verify - Sandbox Cases', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cardSuitsMap = {
    [CardSuitType.Hearts]: '♥️',
    [CardSuitType.Diamonds]: '♦️',
    [CardSuitType.Clubs]: '♣️',
    [CardSuitType.Spades]: '♠️',
    [CardSuitType.Hidden]: '🂠',
  }
  const cardRanksMap = {
    [CardValueType.Two]: '2',
    [CardValueType.Three]: '3',
    [CardValueType.Four]: '4',
    [CardValueType.Five]: '5',
    [CardValueType.Six]: '6',
    [CardValueType.Seven]: '7',
    [CardValueType.Eight]: '8',
    [CardValueType.Nine]: '9',
    [CardValueType.Ten]: '10',
    [CardValueType.Jack]: 'J',
    [CardValueType.Queen]: 'Q',
    [CardValueType.King]: 'K',
    [CardValueType.Ace]: 'A',
  }
  const cases = [
    {
      name: 'Verifies A Game As Expected',
      inputs: {
        revealedSeed:
          'oVxignkYBiARlZD8AXimwb2t2E3DSqW7D6Mb2sCg0YaWkx0MVq448VGAVRg4AC7AQePKgF2GCM85wRUtlytT5mk5QgjfnVNWszhHWeGUSOX2obaD1D5GxrcyQXwQxgwpXvPwoeaGWk7VQCRtQJbpG12BCBq1kb7UiayVTvwWOPg1OfAzwQ0DDVWCDpFDMAOxBAz5aaYoXw24vDrWMjcn8fhB7JwPzJrJaDpC9hJH4jMoisykxSGXzHwDKmiuaPwT' /* YOUR SERVER SEED */,
        clientSeed:
          'b36912161aef81bfdb4eee6bebdbf048a6563d68f571de4bab94b6897dd455d3' /* YOUR CLIENT SEED */,
        gameNonce: 5 /* YOUR GAME'S NONCE */,
        actionsHash:
          'P0H0A01707151557205S0A01707151557205S1A11707151568502S4A11707151578713S6A21707151600240D0H0A01707151557205S2A01707151557205S3A11707151568503S5A21707151578713' /* YOUR ACTIONS HASH */,
      },
      expects: {
        actionsCount: 9,
        lastShoeIndex: 6,
        gameHash:
          'e481c9d512d72e1f82249452144cc10e5fdd749480bf028938271169335ca496',
        shoeUsed: 'Q♦️ - 4♣️ - 7♦️ - 2♦️ - 10♥️ - 8♠️ - 3♥️',
        dealerCards: '7♦️ - 2♦️ - 8♠️',
        playerHands: ['Q♦️ - 4♣️ - 10♥️ - 3♥️'],
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { revealedSeed, clientSeed, gameNonce, actionsHash } = inputs
    const {
      shoeUsed,
      dealerCards,
      playerHands,
      gameHash,
      actionsCount,
      lastShoeIndex,
    } = expects
    const playerParts = [
      { roundHash: clientSeed, nonce: gameNonce, clientSeed: 'changeThisSeed' },
    ]

    const decodedActions = decodeActions(actionsHash)
    expect(decodedActions).not.toBeInstanceOf(String)
    expect(decodedActions).toHaveLength(3)
    expect(decodedActions[0]).toHaveLength(2)
    expect(decodedActions[1]).toBe(lastShoeIndex)
    expect(decodedActions[2]).toBe(actionsCount)
    const [gameActions, lastIndex] = decodedActions as [Table, number, number]

    const { gameRoundHash } = createFinalHash(revealedSeed, playerParts)
    expect(gameRoundHash).toBe(gameHash)

    const gameShoe = getProvableShoe(gameRoundHash).slice(0, lastIndex + 1)
    const usedShoeCards = gameShoe.map(
      card => `${cardRanksMap[card.value]}${cardSuitsMap[card.suit]}`,
    )
    const usedShoe = usedShoeCards.join(' - ')
    expect(usedShoe).toBe(shoeUsed)

    const playerHandsDealt = gameActions[0].hands
      .filter(isPlayerHand)
      .map(hand =>
        hand.actions
          .filter(isHandActionWithShoe)
          .map(act => usedShoeCards[act.shoeIndex])
          .join(' - '),
      )
    expect(playerHandsDealt).toEqual(playerHands)

    const dealerSeat = gameActions[gameActions.length - 1] as DealerSeat
    const dealerCardsDealt = dealerSeat.hands[0]!.actions.filter(
      isHandActionWithShoe,
    )
      .map(act => usedShoeCards[act.shoeIndex])
      .join(' - ')
    expect(dealerCardsDealt).toBeDefined()
    expect(dealerCardsDealt).toBe(dealerCards)
  })
})

function decodeActions(actionString: string): string | [Table, number, number] {
  const result: Table = [] as unknown as Table
  let player: any
  let hand: any
  let action: any
  let i = 0
  let lastIndex = 0
  let actionCount = 0
  let wager: object | undefined = {}

  const readChars = (num: number) => {
    const ret = actionString.substring(i, i + num)
    i += num
    return ret
  }

  const readNumber = () => {
    let pos = i
    while (Number.isInteger(parseInt(actionString[pos]))) {
      pos++
    }
    return parseInt(readChars(pos - i))
  }

  while (i < actionString.length) {
    const curChar = readChars(1)
    if (['P', 'D'].includes(curChar)) {
      const isDealer = curChar === 'D'
      const playerId = `${curChar}${readChars(1)}`
      player = { id: `${isDealer ? DEALER_ID : playerId}` }
      wager = isDealer ? undefined : {}
      result.push(player)
    } else if (curChar === 'H') {
      hand = { index: parseInt(readChars(1)), wager, status: {} }
      player.hands = player.hands || []
      player.hands.push(hand)
    } else if (curChar === 'A') {
      const type = parseInt(readChars(1))
      const timestamp = new Date(parseInt(readChars(13)))
      action = { timestamp, type }
      hand.actions = hand.actions || []
      hand.actions.push(action)
      actionCount++
    } else if (curChar === 'S') {
      action.shoeIndex = readNumber() // parseInt(readChars(1))
      if (lastIndex < action.shoeIndex) {
        lastIndex = action.shoeIndex
      }
    } else {
      return `Error decoding actions at: ${i} with char: ${curChar}`
    }
  }

  return [result, lastIndex, actionCount]
}

function completeGame(game: GameState, dealerWins = false): GameState {
  const retGame = { ...game }
  if (dealerWins) {
    const dealer = retGame.players.find(isDealerSeat)!
    dealer.hands[0]!.cards[DEALER_HOLE_INDEX].hidden = false
    dealer.hands[0]!.cards[DEALER_HOLE_INDEX].value = CardValueType.Eight
    dealer.hands[0]!.status = {
      ...HandStatusDefault,
      outcome: HandOutcomeType.Win,
    }

    const player = retGame.players.find(isPlayerSeat)!
    player.hands[0].status = {
      ...player.hands[0].status,
      outcome: HandOutcomeType.Loss,
    }
  }
  retGame.status = GameStatus.Complete
  return retGame
}

function getVerifyData(
  gameId: string,
  playerId: string,
  betId: string,
): VerifyData<typeof BLACKJACK_GAME_NAME> {
  return {
    betId,
    user: { id: playerId },
    gameName: BLACKJACK_GAME_NAME,
    bet: makeBetWithId(gameId, playerId, betId),
  }
}

function makeBetWithId(
  gameId: string,
  playerId: string,
  betId: string,
): BetHistoryDocument {
  return {
    _id: betId,
    betAmount: 100,
    balanceType: 'crypto',
    currency: 'usd',
    closedOut: true,
    closeoutComplete: true,
    paidOut: true,
    ranHooks: true,
    attempts: 1,
    gameId,
    betId,
    gameName: BLACKJACK_GAME_NAME,
    transactionIds: [],
    incognito: false,
    highroller: false,
    payoutValue: 0,
    mult: 0,
    profit: -100,
    userId: playerId,
    won: false,
    timestamp: new Date('2024-01-10T18:54:18.049Z'),
    deleteAfterRecord: true,
    closeoutTimestamp: new Date('2024-01-10T18:54:18.049Z'),
    createdAt: new Date('2024-01-10T18:54:18.049Z'),
    updatedAt: new Date('2024-01-10T18:54:18.084Z'),
  } as unknown as BetHistoryDocument
}
