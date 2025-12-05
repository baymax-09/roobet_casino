import { CardSuitType, CardValueType } from './cards'
import { ClientGameState } from './client'
import {
  GameStatus,
  HandOutcomeType,
  HandWagerType,
  WagerOutcomeType,
  isPlayerSeat,
  type GameState,
} from './player'

describe('Client State Tests', () => {
  it('Hides Player Outcomes On Incomplete Games', () => {
    const game: GameState = {
      id: '6617be131d5cbd2d29076e4f',
      status: GameStatus.Active,
      seed: 'Sbr5KppnBmY1fqS4uK9b1hlXmfPRRO9Tuip1AlcVyBQdqmrVUqcGHBTacuon5s21mOEZXVS1rGIXHQ66VFikqI9MraC5zGOsyv1gIhRj36uNHtR9Vk8PE2xiQGLtTb2wAvD87IrDxyo7817flKrtpOuCXOyVtzQlATUpXAnqk3ovec8LYkFzNVR36LnFSs6xWfeplEpHrk5qTxYj2Be3tyQyL3uD8n9vOw2ZACvszWQR8VTS0yXXYQ0pMjmrel5K',
      hash: 'e40d0956f9dd523d7513724552c7325c4c41f0386b052aba00953564bbe62542',
      players: [
        {
          playerId: 'ef486c80-be47-44e7-b28d-d911d4ee48c1',
          betId: 'e9924f04-277b-4eca-8e71-64f6ff3922f8',
          seatIndex: 0,
          hands: [
            {
              handIndex: 0,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Spades,
                  value: CardValueType.Two,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Diamonds,
                  value: CardValueType.Seven,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Spades,
                  value: CardValueType.Six,
                  hidden: false,
                },
              ],
              status: {
                value: 15,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: false,
                canStand: false,
                canInsure: false,
                canSplit: false,
                canDoubleDown: false,
                splitFrom: null,
                wasDoubled: true,
                outcome: HandOutcomeType.Push,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 0,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 1,
                },
                {
                  type: 3,
                  timestamp: new Date(1712832038494),
                  shoeIndex: 16,
                },
                { type: 2, timestamp: new Date(1712832038494) },
              ],
            },
            {
              handIndex: 1,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Win,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Five,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Five,
                  hidden: false,
                },
              ],
              status: {
                value: 10,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: true,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 2,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 3,
                },
              ],
            },
            {
              handIndex: 2,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Three,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Diamonds,
                  value: CardValueType.Six,
                  hidden: false,
                },
              ],
              status: {
                value: 9,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 4,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 5,
                },
              ],
            },
            {
              handIndex: 3,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Six,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Diamonds,
                  value: CardValueType.Eight,
                  hidden: false,
                },
              ],
              status: {
                value: 14,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 6,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 7,
                },
              ],
            },
            {
              handIndex: 4,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Diamonds,
                  value: CardValueType.Five,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Ace,
                  hidden: false,
                },
              ],
              status: {
                value: 16,
                isHard: false,
                isSoft: true,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 8,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 9,
                },
              ],
            },
            {
              handIndex: 5,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Two,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Hearts,
                  value: CardValueType.Eight,
                  hidden: false,
                },
              ],
              status: {
                value: 10,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 10,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 11,
                },
              ],
            },
            {
              handIndex: 6,
              wager: {
                type: HandWagerType.Main,
                amount: 1,
                sides: [
                  {
                    type: HandWagerType.PerfectPair,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                  {
                    type: HandWagerType.TwentyOnePlusThree,
                    amount: 1,
                    outcome: WagerOutcomeType.Loss,
                  },
                ],
              },
              cards: [
                {
                  suit: CardSuitType.Spades,
                  value: CardValueType.Four,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Clubs,
                  value: CardValueType.Three,
                  hidden: false,
                },
              ],
              status: {
                value: 7,
                isHard: true,
                isSoft: false,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 12,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 13,
                },
              ],
            },
          ],
        },
        {
          playerId: 'dealer',
          hands: [
            {
              handIndex: 0,
              cards: [
                {
                  suit: CardSuitType.Spades,
                  value: CardValueType.Four,
                  hidden: false,
                },
                {
                  suit: CardSuitType.Diamonds,
                  value: CardValueType.Ace,
                  hidden: true,
                },
              ],
              status: {
                value: 15,
                isHard: false,
                isSoft: true,
                isBust: false,
                isBlackjack: false,
                canHit: true,
                canStand: true,
                canInsure: false,
                canSplit: false,
                canDoubleDown: true,
                splitFrom: null,
                wasDoubled: false,
                outcome: HandOutcomeType.Unknown,
              },
              actions: [
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 14,
                },
                {
                  type: 0,
                  timestamp: new Date(1712832032420),
                  shoeIndex: 15,
                },
              ],
            },
          ],
        },
      ],
    }

    const clientGame = ClientGameState.fromGameState(game)
    expect(clientGame.status).toBe(game.status)
    expect(clientGame.players).toHaveLength(game.players.length)
    expect(clientGame.players[0].hands).toHaveLength(
      game.players[0].hands.length,
    )
    expect(
      clientGame.players
        .filter(isPlayerSeat)
        .every(player =>
          player.hands.every(
            hand =>
              !!hand.status && hand.status.outcome === HandOutcomeType.Unknown,
          ),
        ),
    ).toBe(true)
  })
})
