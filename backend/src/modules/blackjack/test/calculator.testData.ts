import {
  CardSuitType,
  CardValueType,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandWagerType,
  WagerOutcomeType,
  type GameState,
} from '../types'

export const MissedHitGame: GameState = {
  id: '65a6a99b5164b38ec588acdd',
  status: GameStatus.Active,
  seed: 'lOnjPhfbTHbHqRuqgdVPBK1siVqDzRPC8lMI2MHPtoOs3tW032w1PSpT9gp1OMp81A09YKEPTwbvnR6uNlSCzv49qSqJCVBKkhaztBGWQQ94YQhCiAcWbKmAkuhoejWcGxyPKLgwkcqwmTctazq8Z5pjpCgjQ4xJL5RAO7rhmmGtQbeBbsL10lWvlT2nUuG8NW12xyCj1gQFqWnPlNhBJrjXDSJy6mXl1ZFp77LyBKnO1MRo1xu0YOB09yWdqZfm',
  hash: 'cebe751ab096ed12233b69fd500ce790fb0d3a728f91d58012d20367d2534bb9',
  players: [
    {
      seatIndex: 0,
      playerId: '964f13ca-02c3-425a-90c7-df8c4721cad2',
      betId: 'aa82b19c-47c1-4f26-8c9a-81ba51c345d0',
      hands: [
        {
          handIndex: 0,
          wager: {
            type: HandWagerType.Main,
            amount: 100,
            sides: [
              {
                type: HandWagerType.PerfectPair,
                amount: 100,
                outcome: WagerOutcomeType.Loss,
              },
            ],
          },
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Three,
              hidden: false,
            },
            {
              suit: CardSuitType.Diamonds,
              value: CardValueType.King,
              hidden: false,
            },
            {
              suit: CardSuitType.Spades,
              value: CardValueType.Ten,
              hidden: false,
            },
          ],
          status: {
            value: 23,
            isHard: false,
            isSoft: false,
            isBust: true,
            isBlackjack: false,
            canHit: false,
            canStand: false,
            canInsure: false,
            canSplit: false,
            canDoubleDown: false,
            splitFrom: null,
            wasDoubled: false,
            outcome: HandOutcomeType.Loss,
          },
          actions: [
            {
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T16:07:16.665Z')),
              shoeIndex: 0,
            },
            {
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T16:07:16.665Z')),
              shoeIndex: 1,
            },
            {
              type: HandActionType.Hit,
              timestamp: new Date(Date.parse('2024-01-16T16:08:18.455Z')),
              shoeIndex: 4,
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
              suit: CardSuitType.Diamonds,
              value: CardValueType.Three,
              hidden: false,
            },
            {
              suit: CardSuitType.Spades,
              value: CardValueType.Ten,
              hidden: true,
            },
          ],
          status: {
            value: 13,
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
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T16:07:16.666Z')),
              shoeIndex: 2,
            },
            {
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T16:07:16.666Z')),
              shoeIndex: 3,
            },
          ],
        },
      ],
    },
  ],
}

export const BadHandOutcomeOnStandGame: GameState = {
  id: '65a6bd47403fb5a852a45beb',
  status: GameStatus.Active,
  seed: 'BEr3gw9H1PAac35vuSfBMHt7nmn3nVr3EpCxKOIuBqXwGaBHmIQOTxCYoEbAY5okw1Y3aawETxE2tG4OfMrH15DnIA8MajRz1i7Z3rSeTLyGO64C02UPufj4hldRD7dJvpRkPpfksY5zVHnxWKeVBuPs2BodgV4sTscYsAwRSDt447c6Z106RWSaJkSY7N83hXogCyaT5zJjsVKA1kW3kl1kLG8GiZlNEYVEVFwPCykzxl4OixpBUwlJq7X4cc0U',
  hash: '2adf4dcd5c0ba7d79733a9666549f537fb0a161c9409493a2020bc181aad37c2',
  players: [
    {
      seatIndex: 0,
      playerId: '964f13ca-02c3-425a-90c7-df8c4721cad2',
      betId: 'dc96dfba-6f30-424a-810c-255d6387c924',
      hands: [
        {
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Diamonds,
              value: CardValueType.Ace,
              hidden: false,
            },
          ],
          status: {
            value: 19,
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
              shoeIndex: 0,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T17:30:57.737Z')),
            },
            {
              shoeIndex: 1,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T17:30:57.737Z')),
            },
          ],
          handIndex: 0,
          wager: {
            type: HandWagerType.Main,
            amount: 100,
            sides: [
              {
                type: HandWagerType.PerfectPair,
                amount: 100,
                outcome: WagerOutcomeType.Loss,
              },
            ],
          },
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
              value: CardValueType.Five,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Queen,
              hidden: false,
            },
          ],
          status: {
            value: 15,
            isHard: false,
            isSoft: false,
            isBust: true,
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
              shoeIndex: 2,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T17:30:57.737Z')),
            },
            {
              shoeIndex: 3,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T17:30:57.737Z')),
            },
          ],
        },
      ],
    },
  ],
}

export const BadGameStatusOnHit01: GameState = {
  id: '65a6e3dd2770a5515c66cfd4',
  seed: '5ELIbqQqOJVIIeilHYrjSrRv9Ef5RgUGwyKEsJGuhUU9i89ift18BuqeqoRlh1FN96cRLfXpp6uYzy6hkUo65MfmOkSohQ0WHZNNUOEPOBRADve089BtpgEK9FDCu7KLZXuyvC4gWmFQN9hKTzIR9lyyw8lznh9FLhYaeSm9C8vnPAh7d57RU9hDLC0y5eqioh7Zy5nlE488tSETNrjOiVF7WJncWxPZ625zXEnQcXiXh7JxTzF4kx8hGYJgRVz9',
  hash: 'b215b5227c6b8cf1047d0b624311a21944582ef55755f76c553596361997bd18',
  status: GameStatus.Active,
  players: [
    {
      seatIndex: 0,
      playerId: '964f13ca-02c3-425a-90c7-df8c4721cad2',
      betId: 'a77b4c1e-e5a1-4005-83ca-1774597f3ed8',
      hands: [
        {
          cards: [
            {
              suit: CardSuitType.Spades,
              value: CardValueType.Seven,
              hidden: false,
            },
            {
              suit: CardSuitType.Spades,
              value: CardValueType.Three,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Four,
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
            canDoubleDown: false,
            splitFrom: null,
            wasDoubled: false,
            outcome: HandOutcomeType.Unknown,
          },
          actions: [
            {
              shoeIndex: 0,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T20:15:59.914Z')),
            },
            {
              shoeIndex: 1,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T20:15:59.914Z')),
            },
            {
              shoeIndex: 4,
              type: HandActionType.Hit,
              timestamp: new Date(Date.parse('2024-01-16T20:16:16.975Z')),
            },
          ],
          handIndex: 0,
          wager: {
            type: HandWagerType.Main,
            amount: 100,
            sides: [
              {
                type: HandWagerType.PerfectPair,
                amount: 100,
                outcome: WagerOutcomeType.Loss,
              },
            ],
          },
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
              suit: CardSuitType.Diamonds,
              value: CardValueType.Queen,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Four,
              hidden: true,
            },
            {
              suit: CardSuitType.Hearts,
              value: CardValueType.Ace,
              hidden: false,
            },
          ],
          status: {
            value: 15,
            isHard: true,
            isSoft: false,
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
              shoeIndex: 2,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T20:15:59.914Z')),
            },
            {
              shoeIndex: 3,
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T20:15:59.914Z')),
            },
            {
              shoeIndex: 5,
              type: HandActionType.Hit,
              timestamp: new Date(Date.parse('2024-01-16T20:16:16.976Z')),
            },
          ],
        },
      ],
    },
  ],
}

export const BadGameStatusOnHit02: GameState = {
  id: '65a70262f18ac0fa38368bc0',
  seed: 'GD5LroQaEqbJs7J2h9S0WZ3CYAnqnUBkeOgE9rA5J5XGcBtDLmWo1Rk3u32yMTqTGmzbRsUZFcxhTKdlY9TT00160Edvk6zjNpLrwc0DKOTGTYdl6OxR7veNJpYnVqNRqUfdTyUi8HrmDRPJM4xNmMHeDhiOvLhXSoaZd9GEKwKj34auChcxpKytMozEsm8zGrTFAHDmPAgYfXr708CLPC342XRWwNgzn6r4ph64yOYZNYqxIpxEXXjTnh1v9Fs9',
  hash: 'd68fe5fa9363a4344689e0e99843d65c66fe3ba4f5eea854ef0bdfbf3e1d1f7c',
  status: GameStatus.Active,
  players: [
    {
      seatIndex: 0,
      playerId: '964f13ca-02c3-425a-90c7-df8c4721cad2',
      betId: 'c05ab65a-2bd2-4620-8ebc-d02dc42d23ca',
      hands: [
        {
          handIndex: 0,
          wager: {
            type: HandWagerType.Main,
            amount: 100,
            sides: [
              {
                type: HandWagerType.PerfectPair,
                amount: 100,
                outcome: WagerOutcomeType.Loss,
              },
            ],
          },
          cards: [
            {
              suit: CardSuitType.Hearts,
              value: CardValueType.Ten,
              hidden: false,
            },
            {
              suit: CardSuitType.Hearts,
              value: CardValueType.Six,
              hidden: false,
            },
          ],
          status: {
            value: 16,
            isHard: true,
            isSoft: false,
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
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T22:25:49.060Z')),
              shoeIndex: 0,
            },
            {
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T22:25:49.060Z')),
              shoeIndex: 1,
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
              value: CardValueType.Queen,
              hidden: false,
            },
            {
              suit: CardSuitType.Diamonds,
              value: CardValueType.Four,
              hidden: true,
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
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T22:25:49.061Z')),
              shoeIndex: 2,
            },
            {
              type: HandActionType.Deal,
              timestamp: new Date(Date.parse('2024-01-16T22:25:49.061Z')),
              shoeIndex: 3,
            },
          ],
        },
      ],
    },
  ],
}
