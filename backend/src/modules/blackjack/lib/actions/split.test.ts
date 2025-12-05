import * as balanceLib from '../../../../modules/user/balance/lib'
import * as userDoc from '../../../../modules/user/documents/user'
import * as betLib from '../../../bet'
import * as gameDoc from '../../documents/blackjackGames'
import {
  buildBasicDealtGame,
  buildBasicDealtGameWithPlayerId,
  getMockedLogger,
  getObjectIdValue,
} from '../../test'
import {
  BlackjackActiveWagerUpdateError,
  BlackjackInsufficientFundsError,
  BlackjackNoActiveWagerError,
  BlackjackPlayerNotFoundError,
  BlackjackSplitWagerError,
  CardSuitType,
  CardValueType,
  HandActionType,
  isPlayerHand,
  isPlayerSeat,
  type GameState,
  type HandActionHit,
  type PlayerCard,
  type PlayerHand,
} from '../../types'
import * as dealerLib from '../dealer'
import { split } from './split'

describe('Split Hand', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const logScope = 'mutateBetWithSplitWager'
  const validGame = buildBasicDealtGame()
  const playerId = validGame.players[0].playerId
  const splitCards: PlayerCard[] = [
    { suit: CardSuitType.Clubs, value: CardValueType.Eight, hidden: false },
    { suit: CardSuitType.Hearts, value: CardValueType.Eight, hidden: false },
  ]
  const cases = [
    {
      name: 'Split A Hand As Expected',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 200,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: undefined,
      },
    },
    {
      name: 'Split A Hand In Multi-Hand Seat As Expected',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 2, splitCards),
        handIndex: 0,
        accept: true,
        balance: 200,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        handCount: 3,
        throws: undefined,
      },
    },
    {
      name: 'Throws When User Cannot Be Found',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: null,
        updateBetResult: undefined,
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackPlayerNotFoundError(
          validGame.id,
          logScope,
          playerId,
        ),
      },
    },
    {
      name: 'Throws When User Has Insufficient Funds',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: { balanceType: 'playable', balance: 0 },
      },
      expects: {
        throws: new BlackjackInsufficientFundsError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          logScope,
        ),
      },
    },
    {
      name: 'Throws When Balance Deduction Fails',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: undefined,
        deductBalanceResult: {
          balanceType: 'playable',
          balance: 100,
          transactionId: getObjectIdValue(),
        },
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackSplitWagerError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          logScope,
        ),
      },
    },
    {
      name: 'Throws Without An ActiveBet',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: null,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackNoActiveWagerError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          logScope,
        ),
      },
    },
    {
      name: 'Throws When Update Bet Fails',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: { errors: 1, first_error: 'Something bad happened.' },
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackActiveWagerUpdateError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          logScope,
        ),
      },
    },
    {
      name: 'Throws When Update Bet Fails Without Error',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(1, 1, splitCards),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: { errors: 1 },
        getActiveBetResult: undefined,
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackActiveWagerUpdateError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          logScope,
        ),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const {
      balance,
      deductBalanceResult,
      game,
      getActiveBetResult,
      getBalanceResult,
      getUserResult,
      handIndex,
      playerId,
      updateBetResult,
    } = inputs
    const { throws } = expects
    const gameId = game.id
    const handCount = expects.handCount ?? 2

    // Mock dealer
    jest.spyOn(dealerLib, 'maybeDealersTurn').mockReturnValue(game)

    // Mock game doc
    jest.spyOn(gameDoc, 'getGameById').mockResolvedValue(Promise.resolve(game))
    jest.spyOn(gameDoc, 'upsertGame').mockImplementation(async game => game)
    jest.spyOn(gameDoc, 'deleteGame').mockImplementation(async _gameId => {})

    // Mock bet lib
    jest.spyOn(betLib, 'getActiveBetById').mockResolvedValue(
      Promise.resolve(
        getActiveBetResult === undefined
          ? {
              id: getObjectIdValue(),
              playerCount: 1,
              seatIndex: 0,
              handWagers: { [handIndex]: { amount: 1, sides: [] } },
            }
          : (getActiveBetResult as any),
      ),
    )
    jest
      .spyOn(betLib, 'updateActiveBetForUser')
      .mockResolvedValue(
        Promise.resolve(
          updateBetResult === undefined ? { errors: 0 } : updateBetResult,
        ),
      )

    // Mock user
    jest
      .spyOn(userDoc, 'getUserById')
      .mockResolvedValue(
        Promise.resolve(
          getUserResult === undefined
            ? { id: playerId }
            : (getUserResult as any),
        ),
      )

    // Mock balance lib
    jest
      .spyOn(balanceLib, 'getSelectedBalanceFromUser')
      .mockResolvedValue(
        getBalanceResult === undefined
          ? { balanceType: 'playable', balance }
          : getBalanceResult,
      )
    jest.spyOn(balanceLib, 'deductFromBalance').mockImplementation(async args =>
      Promise.resolve(
        deductBalanceResult === undefined
          ? {
              balanceType: 'playable',
              balance: balance - args.amount,
              transactionId: getObjectIdValue(),
            }
          : deductBalanceResult,
      ),
    )

    // Silence the logger with a mock
    getMockedLogger()

    // Test
    if (!!throws && typeof throws === 'object') {
      await expect(split(gameId, playerId, handIndex)).rejects.toThrow(throws)
    } else {
      let postGame: GameState | undefined
      await expect(
        split(gameId, playerId, handIndex).then(post => {
          postGame = post
          return post
        }),
      ).resolves.toBeDefined()
      expect(postGame).toBeDefined()

      // Should have two hands now
      expect(postGame!.players[0].hands).toHaveLength(handCount)
      for (let i = 0; i < handCount; i++) {
        expect(isPlayerHand(postGame!.players[0].hands[i])).toBe(true)
      }

      // Each hand index should increment from the previous
      for (let i = 0; i < handCount - 1; i++) {
        expect(postGame!.players[0].hands[i].handIndex).toBe(
          postGame!.players[0].hands[i + 1].handIndex - 1,
        )
      }

      // The first should show a split & hit
      expect(isPlayerHand(postGame!.players[0].hands[0]!)).toBe(true)
      const playerHand1 = postGame!.players[0].hands[0] as PlayerHand

      expect(playerHand1.wager.amount).toBe(100)
      expect(playerHand1.actions).toHaveLength(3)
      expect(playerHand1.actions[1].type).toEqual(HandActionType.Split)
      expect(playerHand1.actions[2].type).toEqual(HandActionType.Deal)
      expect((playerHand1.actions[2] as HandActionHit).shoeIndex).toBe(4)

      // The second should show a hit
      expect(isPlayerHand(postGame!.players[0].hands[1])).toBe(true)
      const playerHand2 = postGame!.players[0].hands[1] as PlayerHand

      expect(playerHand2.wager.amount).toEqual(playerHand1.wager.amount)
      expect(playerHand2.actions).toHaveLength(3)
      expect(playerHand2.actions[0].type).toEqual(HandActionType.Deal)
      expect((playerHand2.actions[0] as HandActionHit).shoeIndex).toBe(1)
      expect(playerHand2.actions[1].type).toEqual(HandActionType.Deal)
      expect((playerHand2.actions[1] as HandActionHit).shoeIndex).toBe(5)
      expect(playerHand2.actions[2].type).toEqual(HandActionType.Split)

      // The second status.splitFrom MUST not be null,
      // and MUST show it was split from the first hand,
      // and MUST immediately follow the first hand in the array
      expect(playerHand2.status.splitFrom).not.toBeNull()
      expect(playerHand2.status.splitFrom).toBe(playerHand1.handIndex)

      const playerSeat = postGame!.players[0]
      expect(isPlayerSeat(playerSeat)).toBe(true)
      if (isPlayerSeat(playerSeat)) {
        const firstIndex = playerSeat.hands.indexOf(playerHand1)
        const secondIndex = playerSeat.hands.indexOf(playerHand2)
        expect(secondIndex).toBe(firstIndex + 1)
      }
    }
  })
})
