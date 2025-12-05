import {
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandWagerType,
  isDealerSeat,
  isPlayerSeat,
  type GameState,
  type PlayerSeat,
} from '../lib'
import { isPlayableHand, validatePlayerHandAction } from '../utils'

it('Plays All Hands With The Dealer Last And All Outcomes Held Until The End', () => {
  const game: GameState = {
    id: '65f84f398f1c67dbb310dc38',
    status: GameStatus.Active,
    seed: '3LEO2pHQC5GO3YosjdUtdHOhuhgGQBPVxWYl2smxZsqm7981DXNmlhQVt35sN7Azr0DyK0qDqJMQ7qy2NsTmV4SIWimMhfYSS6rCaWzIRBO28g2Cg9ejMLstj4LBhz4ln5SyuaQtKveED1Z3NhRoD3TrTIFIcA10fwAEkVT6HJdKRRxhCAgAQrqbe7Qt9zetxuzeXQaJwVUnXgzU40kBkGFhU3eecEGrrPhAfcpDmmDRrNcuLxVWEzS6IkUyELwL',
    hash: '464d6211b5f08f364d87f0282f0ea996aec11b1af2f2868fc204ab210fb0c6ea',
    players: [
      {
        playerId: '1c6006fc-5a0f-414f-92d5-d05513d4a57a',
        betId: '6afbaa73-c1cc-4b17-8247-e45593e735de',
        seatIndex: 0,
        hands: [
          {
            handIndex: 1,
            wager: { type: HandWagerType.Main, amount: 30, sides: [] },
            cards: [
              {
                suit: CardSuitType.Clubs,
                value: CardValueType.Three,
                hidden: false,
              },
              {
                suit: CardSuitType.Diamonds,
                value: CardValueType.Six,
                hidden: false,
              },
              {
                suit: CardSuitType.Spades,
                value: CardValueType.Eight,
                hidden: false,
              },
            ],
            status: {
              value: 17,
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
              wasDoubled: false,
              outcome: HandOutcomeType.Unknown,
            },
            actions: [
              {
                type: 0,
                timestamp: new Date(1710772031658),
                shoeIndex: 0,
              },
              {
                type: 0,
                timestamp: new Date(1710772031658),
                shoeIndex: 1,
              },
              {
                type: 1,
                timestamp: new Date(1710773163916),
                shoeIndex: 6,
              },
              { type: 2, timestamp: new Date(1710773176243) },
            ],
          },
          {
            handIndex: 2,
            wager: { type: HandWagerType.Main, amount: 30, sides: [] },
            cards: [
              {
                suit: CardSuitType.Clubs,
                value: CardValueType.Four,
                hidden: false,
              },
              {
                suit: CardSuitType.Spades,
                value: CardValueType.Five,
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
                timestamp: new Date(1710772031658),
                shoeIndex: 2,
              },
              {
                type: 0,
                timestamp: new Date(1710772031658),
                shoeIndex: 3,
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
                suit: CardSuitType.Hearts,
                value: CardValueType.Ten,
                hidden: false,
              },
              {
                suit: CardSuitType.Diamonds,
                value: CardValueType.Queen,
                hidden: true,
              },
            ],
            status: {
              value: 20,
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
                timestamp: new Date(1710772031658),
                shoeIndex: 4,
              },
              {
                type: 0,
                timestamp: new Date(1710772031659),
                shoeIndex: 5,
              },
            ],
          },
        ],
      },
    ],
  }

  const player = game.players.find(isPlayerSeat)!
  const dealer = game.players.find(isDealerSeat)!

  expect(isPlayableHand(player.hands[0], false)).toBe(false)
  expect(isPlayableHand(player.hands[1], false)).toBe(true)
  expect(dealer.hands[0]?.cards).toHaveLength(2)
  expect(dealer.hands[0]?.actions).toHaveLength(2)

  let allowedPlayer: PlayerSeat | undefined
  expect(() => {
    allowedPlayer = validatePlayerHandAction(
      game,
      player.playerId,
      player.hands[1].handIndex,
      HandActionType.Hit,
    )
  }).not.toThrow()
  expect(allowedPlayer).toBeDefined()
  expect(allowedPlayer).toBe(player)
})
