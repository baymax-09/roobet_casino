import * as gameDoc from '../../documents/blackjackGames'
import {
  buildBasicMainWager,
  getMockedLogger,
  getObjectIdValue,
} from '../../test'
import {
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  type GameState,
} from '../../types'
import * as utilsLib from '../../utils'
import * as dealerLib from '../dealer'
import { stand } from './stand'

let dateIncr = 0
const getTimestamp = (): Date => {
  const ret = new Date(Date.now() + dateIncr)
  dateIncr += 500
  return ret
}

describe('Stand Hand', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const playerId = 'test'
  const validGameSeed = utilsLib.getRandomSeed()
  const validGameId = getObjectIdValue()
  const cases = [
    {
      name: 'Stands A Hand As Expected',
      inputs: {
        playerId,
        handIndex: 0,
        game: {
          id: validGameId,
          seed: validGameSeed,
          hash: validGameSeed,
          status: GameStatus.Active,
          players: [
            {
              playerId,
              hands: [
                {
                  handIndex: 0,
                  wager: buildBasicMainWager(100),
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Six,
                      hidden: false,
                    },
                  ],
                  status: {
                    value: 0,
                    isHard: false,
                    isSoft: true,
                    isBust: false,
                    isBlackjack: false,
                    canHit: true,
                    canStand: true,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: false,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Unknown,
                  },
                  actions: [
                    {
                      shoeIndex: 0,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 1,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                },
              ],
            },
            {
              playerId: DEALER_ID,
              hands: [
                {
                  handIndex: 0,
                  cards: [
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Ace,
                      hidden: false,
                    },
                    {
                      suit: CardSuitType.Clubs,
                      value: CardValueType.Six,
                      hidden: true,
                    },
                  ],
                  actions: [
                    {
                      shoeIndex: 2,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                    {
                      shoeIndex: 3,
                      type: HandActionType.Deal,
                      timestamp: getTimestamp(),
                    },
                  ],
                  status: {
                    value: 0,
                    isHard: false,
                    isSoft: false,
                    isBust: false,
                    isBlackjack: false,
                    canHit: false,
                    canStand: false,
                    canInsure: false,
                    canSplit: false,
                    canDoubleDown: false,
                    splitFrom: null,
                    wasDoubled: false,
                    outcome: HandOutcomeType.Unknown,
                  },
                },
              ],
            },
          ],
        } satisfies GameState,
      },
      expects: {
        throws: undefined,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs }) => {
    const { game, playerId, handIndex } = inputs
    const gameId = game.id

    // Mock dealer
    jest.spyOn(dealerLib, 'maybeDealersTurn').mockReturnValue(game)

    // Mock game doc
    gameDoc.BlackjackGameModel.findById = jest.fn().mockResolvedValue({
      game,
      toObject: () => game,
    })
    jest.spyOn(gameDoc, 'getGameById').mockResolvedValue(Promise.resolve(game))
    jest.spyOn(gameDoc, 'upsertGame').mockImplementation(async game => game)
    jest.spyOn(gameDoc, 'deleteGame').mockImplementation(async _gameId => {})

    // Silence the logger with a mock
    getMockedLogger()

    // Test
    await expect(stand(gameId, playerId, handIndex)).resolves.toBeDefined()
  })
})
