import { getTimestamp } from '../test/utils'
import {
  CardSuitType,
  CardValueType,
  HandActionType,
  HandOutcomeType,
  HandStatusDefault,
  type Card,
  type Hand,
  type HandActionDeal,
} from '../types'
import {
  getHandOutcome,
  getHandStatus,
  getHandValue,
  is21Plus3,
} from './calculator'

describe('Hand Value Calculator', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Calculates Soft Hand Correctly',
      inputs: {
        useAlts: true,
        cards: [
          { suit: CardSuitType.Hearts, value: CardValueType.Ace },
          { suit: CardSuitType.Clubs, value: CardValueType.King },
        ],
      },
      expects: {
        value: 21,
        throws: false,
      },
    },
    {
      name: 'Calculates Hard Hand Correctly (Ace)',
      inputs: {
        useAlts: true,
        cards: [
          { suit: CardSuitType.Hearts, value: CardValueType.Ace },
          { suit: CardSuitType.Clubs, value: CardValueType.King },
          { suit: CardSuitType.Spades, value: CardValueType.Eight },
        ],
      },
      expects: {
        value: 19,
        throws: false,
      },
    },
    {
      name: 'Calculates Hard Hand Correctly (No Ace)',
      inputs: {
        useAlts: true,
        cards: [
          { suit: CardSuitType.Clubs, value: CardValueType.King },
          { suit: CardSuitType.Spades, value: CardValueType.Eight },
        ],
      },
      expects: {
        value: 18,
        throws: false,
      },
    },
    {
      name: 'Calculates Hard Hand Omitting Aces',
      inputs: {
        useAlts: false,
        cards: [
          { suit: CardSuitType.Clubs, value: CardValueType.King },
          { suit: CardSuitType.Spades, value: CardValueType.Eight },
          { suit: CardSuitType.Spades, value: CardValueType.Ace },
        ],
      },
      expects: {
        value: 18,
        throws: false,
      },
    },
    {
      name: 'Calculates Soft Split-able Hand',
      inputs: {
        useAlts: true,
        cards: [
          { suit: CardSuitType.Clubs, value: CardValueType.Ace },
          { suit: CardSuitType.Spades, value: CardValueType.Ace },
        ],
      },
      expects: {
        value: 12,
        throws: false,
      },
    },
    {
      name: 'Calculates a Bust',
      inputs: {
        useAlts: true,
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ten },
          { suit: CardSuitType.Clubs, value: CardValueType.Eight },
          { suit: CardSuitType.Clubs, value: CardValueType.Four },
        ],
      },
      expects: {
        value: 22,
        throws: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { cards, useAlts } = inputs
    const { value, throws } = expects

    if (throws) {
      expect(() => getHandValue(cards, useAlts)).toThrow()
    } else {
      expect(getHandValue(cards, useAlts)).toBe(value)
    }
  })
})

describe('Hand Status', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Is Hard',
      inputs: {
        cards: [
          { suit: CardSuitType.Clubs, value: CardValueType.King },
          { suit: CardSuitType.Diamonds, value: CardValueType.Queen },
        ],
      },
      expects: {
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
    },
    {
      name: 'Is Hard',
      inputs: {
        cards: [
          { suit: CardSuitType.Hearts, value: CardValueType.Ace },
          { suit: CardSuitType.Spades, value: CardValueType.Nine },
          { suit: CardSuitType.Clubs, value: CardValueType.King },
        ],
      },
      expects: {
        value: 20,
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
    },
    {
      name: 'Is Hard & Splits',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.King },
          { suit: CardSuitType.Clubs, value: CardValueType.King },
        ],
      },
      expects: {
        value: 20,
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
    },
    {
      name: 'Is Soft & Splits',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ace },
          { suit: CardSuitType.Clubs, value: CardValueType.Ace },
        ],
      },
      expects: {
        value: 12,
        isHard: true,
        isSoft: true,
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
    },
    {
      name: 'Can Split',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ten },
          { suit: CardSuitType.Clubs, value: CardValueType.Ten },
        ],
      },
      expects: {
        value: 20,
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
    },
    {
      name: 'Is Bust',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ten },
          { suit: CardSuitType.Clubs, value: CardValueType.Eight },
          { suit: CardSuitType.Clubs, value: CardValueType.Four },
        ],
      },
      expects: {
        value: 22,
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
    },
    {
      name: 'Is Blackjack',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ace },
          { suit: CardSuitType.Clubs, value: CardValueType.Queen },
        ],
      },
      expects: {
        value: 21,
        isHard: false,
        isSoft: true,
        isBust: false,
        isBlackjack: true,
        canHit: false,
        canStand: false,
        canInsure: false,
        canSplit: false,
        canDoubleDown: true,
        splitFrom: null,
        wasDoubled: false,
        outcome: HandOutcomeType.Win,
      },
    },
    {
      name: 'Can Insure',
      inputs: {
        cards: [
          { suit: CardSuitType.Spades, value: CardValueType.Ten },
          { suit: CardSuitType.Clubs, value: CardValueType.Queen },
        ],
        dealer: [
          { suit: CardSuitType.Spades, value: CardValueType.Ace },
          { suit: CardSuitType.Clubs, value: CardValueType.Queen },
        ],
      },
      expects: {
        value: 20,
        isHard: true,
        isSoft: false,
        isBust: false,
        isBlackjack: false,
        canHit: true,
        canStand: true,
        canInsure: true,
        canSplit: false,
        canDoubleDown: true,
        splitFrom: null,
        wasDoubled: false,
        outcome: HandOutcomeType.Unknown,
      },
    },
  ].map(cse => ({
    ...cse,
    name: `${cse.name} (${cse.inputs.cards
      .map(cse => CardValueType[cse.value])
      .join(', ')})`,
  }))

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { cards, dealer } = inputs
    const handPlayer = {
      handIndex: 0,
      status: HandStatusDefault,
      actions: cards.map(
        (_, ndx) =>
          ({
            type: HandActionType.Deal,
            timestamp: getTimestamp(),
            shoeIndex: ndx,
          }) satisfies HandActionDeal,
      ),
      cards: cards.map(crd => ({ ...crd, hidden: false })),
    }
    const handDealer = {
      handIndex: 0,
      status: HandStatusDefault,
      actions: [],
      cards: dealer?.map(crd => ({ ...crd, hidden: false })) ?? [],
    }
    const status = getHandStatus(handPlayer, handDealer)
    expect(status).toEqual(expects)
  })
})

describe('Get Hand Outcomes', () => {
  const cases = [
    {
      name: 'Unknown For Hands Without Status',
      inputs: {
        player: {
          handIndex: 0,
          actions: [],
          cards: [],
        } satisfies Hand,
        dealer: {
          handIndex: 0,
          actions: [],
          cards: [],
        } satisfies Hand,
      },
      expects: {
        expectedOutcome: HandOutcomeType.Unknown,
      },
    },
    {
      name: 'Pushes Equal Value Hands',
      inputs: {
        player: {
          handIndex: 0,
          status: {
            ...HandStatusDefault,
            isBlackjack: false,
            isBust: false,
            value: 19,
          },
          actions: [],
          cards: [],
        } satisfies Hand,
        dealer: {
          handIndex: 0,
          status: {
            ...HandStatusDefault,
            isBlackjack: false,
            isBust: false,
            value: 19,
          },
          actions: [],
          cards: [],
        } satisfies Hand,
      },
      expects: {
        expectedOutcome: HandOutcomeType.Push,
      },
    },
    {
      name: 'Loss With Player Less Than Dealer',
      inputs: {
        player: {
          handIndex: 0,
          status: {
            ...HandStatusDefault,
            isBlackjack: false,
            isBust: false,
            value: 18,
          },
          actions: [],
          cards: [],
        } satisfies Hand,
        dealer: {
          handIndex: 0,
          status: {
            ...HandStatusDefault,
            isBlackjack: false,
            isBust: false,
            value: 19,
          },
          actions: [],
          cards: [],
        } satisfies Hand,
      },
      expects: {
        expectedOutcome: HandOutcomeType.Loss,
      },
    },
    {
      name: 'Loss With Player Busted',
      inputs: {
        player: {
          cards: [
            {
              suit: CardSuitType.Spades,
              value: CardValueType.Three,
              hidden: false,
            },
            {
              suit: CardSuitType.Diamonds,
              value: CardValueType.Nine,
              hidden: false,
            },
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.King,
              hidden: false,
            },
          ],
          handIndex: 0,
          status: {
            value: 22,
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
              shoeIndex: 0,
              type: HandActionType.Deal,
              timestamp: new Date('2024-04-02T14:12:23.353Z'),
            },
            {
              shoeIndex: 1,
              type: HandActionType.Deal,
              timestamp: new Date('2024-04-02T14:12:23.353Z'),
            },
            {
              shoeIndex: 4,
              type: HandActionType.Hit,
              timestamp: new Date('2024-04-02T14:12:23.353Z'),
            },
          ],
        } satisfies Hand,
        dealer: {
          cards: [
            {
              suit: CardSuitType.Clubs,
              value: CardValueType.Eight,
              hidden: false,
            },
            {
              suit: CardSuitType.Hidden,
              value: CardValueType.Hidden,
              hidden: false,
            },
          ],
          handIndex: 0,
          status: {
            value: 8,
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
              shoeIndex: 2,
              type: HandActionType.Deal,
              timestamp: new Date('2024-04-02T14:12:23.353Z'),
            },
            {
              shoeIndex: 3,
              type: HandActionType.Deal,
              timestamp: new Date('2024-04-02T14:12:23.353Z'),
            },
          ],
        } satisfies Hand,
      },
      expects: {
        expectedOutcome: HandOutcomeType.Loss,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { player, dealer } = inputs
    const { expectedOutcome } = expects
    const outcome = getHandOutcome(player, dealer)
    expect(outcome).toEqual(expectedOutcome)
  })
})

describe('21 Plus 3', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Suited Three of a Kind (yes)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: true,
      },
    },
    {
      name: 'Suited Three of a Kind (no)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Nine,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: false,
      },
    },
    {
      name: 'Straight Flush (yes)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Nine,
          } satisfies Card,
        ],
        dealerCards: [
          { suit: CardSuitType.Clubs, value: CardValueType.Ten } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: true,
      },
    },
    {
      name: 'Straight Flush (no)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Nine,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Six,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: false,
      },
    },
    {
      name: 'Three Of A Kind (yes)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Spades,
            value: CardValueType.Eight,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Diamonds,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: true,
      },
    },
    {
      name: 'Three Of A Kind (no)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Spades,
            value: CardValueType.Eight,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Diamonds,
            value: CardValueType.Ten,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: false,
      },
    },
    {
      name: 'Straight (yes)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Spades,
            value: CardValueType.Eight,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Diamonds,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: true,
      },
    },
    {
      name: 'Straight (no)',
      inputs: {
        playerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Spades,
            value: CardValueType.Six,
          } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Diamonds,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: false,
      },
    },
    {
      name: 'Flush (yes)',
      inputs: {
        playerCards: [
          { suit: CardSuitType.Clubs, value: CardValueType.Two } satisfies Card,
          { suit: CardSuitType.Clubs, value: CardValueType.Six } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Clubs,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: true,
      },
    },
    {
      name: 'Flush (no)',
      inputs: {
        playerCards: [
          { suit: CardSuitType.Clubs, value: CardValueType.Two } satisfies Card,
          { suit: CardSuitType.Clubs, value: CardValueType.Six } satisfies Card,
        ],
        dealerCards: [
          {
            suit: CardSuitType.Diamonds,
            value: CardValueType.Eight,
          } satisfies Card,
          {
            suit: CardSuitType.Hearts,
            value: CardValueType.Ace,
          } satisfies Card,
        ],
      },
      expects: {
        expected: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { playerCards, dealerCards } = inputs
    const { expected } = expects
    const checkCards = [...playerCards, dealerCards[0]]
    expect(is21Plus3(checkCards)).toBe(expected)
  })
})
