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
  BlackjackAlreadyInsuredWagerError,
  BlackjackInsufficientFundsError,
  BlackjackInsureWagerError,
  BlackjackNoActiveWagerError,
  BlackjackPlayerNotFoundError,
  HandActionType,
  HandWagerType,
  WagerOutcomeType,
  type GameState,
  type HandActionInsurance,
} from '../../types'
import * as dealerLib from '../dealer'
import { insure } from './insure'

describe('Insure Hand', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const validGame = buildBasicDealtGame()
  const playerId = validGame.players[0].playerId
  const cases = [
    {
      name: 'Insures A Hand As Expected',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
        handIndex: 0,
        accept: true,
        balance: 100,
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
      name: 'Declines Insurance As Expected',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
        handIndex: 0,
        accept: false,
        balance: 100,
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
      name: 'Throws When User Cannot Be Found',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
          'mutateBetWithInsuranceWager',
          playerId,
        ),
      },
    },
    {
      name: 'Throws When User Has Insufficient Funds',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
          'mutateBetWithInsuranceWager',
        ),
      },
    },
    {
      name: 'Throws When Insurance Was Already Purchased',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
        handIndex: 0,
        accept: true,
        balance: 100,
        getUserResult: undefined,
        updateBetResult: undefined,
        getActiveBetResult: {
          seatIndex: 0,
          playerCount: 1,
          handWagers: [
            {
              sides: [
                {
                  type: HandWagerType.Insurance,
                  outcome: WagerOutcomeType.Unknown,
                  amount: 50,
                },
              ],
            },
          ],
        },
        deductBalanceResult: undefined,
        getBalanceResult: undefined,
      },
      expects: {
        throws: new BlackjackAlreadyInsuredWagerError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          'mutateBetWithInsuranceWager',
        ),
      },
    },
    {
      name: 'Throws When Balance Deduction Fails',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
        throws: new BlackjackInsureWagerError(
          validGame.id,
          playerId,
          0,
          expect.any(String),
          'mutateBetWithInsuranceWager',
        ),
      },
    },
    {
      name: 'Throws Without An ActiveBet',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
          'mutateBetWithInsuranceWager',
        ),
      },
    },
    {
      name: 'Throws When Update Bet Fails',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
          'coreInsure',
        ),
      },
    },
    {
      name: 'Throws When Update Bet Fails Without Error',
      inputs: {
        ...buildBasicDealtGameWithPlayerId(),
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
          'coreInsure',
        ),
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const {
      accept,
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
      await expect(insure(gameId, playerId, handIndex, accept)).rejects.toThrow(
        throws,
      )
    } else {
      let postGame: GameState | undefined
      await expect(
        insure(gameId, playerId, handIndex, accept).then(post => {
          postGame = post
          return post
        }),
      ).resolves.toBeDefined()
      expect(postGame).toBeDefined()
      expect(postGame!.players).toBeDefined()
      expect(postGame!.players[0]).toBeDefined()
      expect(postGame!.players[0].hands).toBeDefined()
      expect(postGame!.players[0].hands[0]).toBeDefined()
      expect(postGame!.players[0].hands[0]!.actions).toBeDefined()
      expect(postGame!.players[0].hands[0]!.actions).toHaveLength(3)

      const playerAction = postGame!.players[0].hands[0]!.actions[2]
      expect(playerAction.type).toEqual(HandActionType.Insurance)
      expect((playerAction as HandActionInsurance).accept).toEqual(accept)
    }
  })
})
