import {
  CARDS_PER_DECK,
  CardSuitType,
  CardValueType,
  MAX_SHOE_SIZE,
  type Card,
} from '../types'
import { getRandomSeed } from '../utils'
import { getProvableShoe } from './shoe'

describe('Provable Shoe', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const deckSize = 52 // 52 cards per deck
  const shoeSize = 8 * deckSize // 8 decks, 416 cards, per shoe
  const sharedSeed = getRandomSeed()
  const cases = [
    {
      name: 'Same Seed Shuffles Match',
      inputs: {
        seed1: sharedSeed,
        seed2: sharedSeed,
      },
      expects: {
        count: shoeSize,
        equals: true,
        throws: false,
      },
    },
    {
      name: 'Alt Seeded Shuffles Mismatch',
      inputs: {
        seed1: sharedSeed,
        seed2: getRandomSeed(),
      },
      expects: {
        count: shoeSize,
        equals: false,
        throws: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { seed1, seed2 } = inputs
    const { equals, throws, count } = expects

    if (throws) {
      expect(() => getProvableShoe(seed1)).toThrow()
    } else {
      let deck1: Card[] = []
      expect(() => {
        deck1 = getProvableShoe(seed1)
      }).not.toThrow()
      let deck2: Card[] = []
      expect(() => {
        deck2 = getProvableShoe(seed2)
      }).not.toThrow()

      expect(deck1).toHaveLength(count)
      expect(deck2).toHaveLength(count)

      // Check for equality or not
      if (equals) {
        expect(deck1).toEqual(deck2)
      } else {
        expect(deck1).not.toEqual(deck2)
      }

      expect(deck1).not.toContain(undefined)
      expect(deck2).not.toContain(undefined)
      expect(deck1).toEqual(expect.arrayContaining(deck2))
      expect(deck2).toEqual(expect.arrayContaining(deck1))
    }
  })
})

describe('Shuffle Validation', () => {
  it('Distributes Cards Evenly Across Suits and Values', () => {
    const deckSize = 52 // 52 cards per deck
    const shoeSize = 8 * deckSize // 8 decks, 416 cards, per shoe
    const sharedSeed = getRandomSeed()
    const shuffledDeck = getProvableShoe(sharedSeed)

    const suits: Record<string, number> = {
      [CardSuitType.Hearts]: 0,
      [CardSuitType.Diamonds]: 0,
      [CardSuitType.Clubs]: 0,
      [CardSuitType.Spades]: 0,
    }

    const values: Record<number, number> = {
      [CardValueType.Two]: 0,
      [CardValueType.Three]: 0,
      [CardValueType.Four]: 0,
      [CardValueType.Five]: 0,
      [CardValueType.Six]: 0,
      [CardValueType.Seven]: 0,
      [CardValueType.Eight]: 0,
      [CardValueType.Nine]: 0,
      [CardValueType.Ten]: 0,
      [CardValueType.Jack]: 0,
      [CardValueType.Queen]: 0,
      [CardValueType.King]: 0,
      [CardValueType.Ace]: 0,
    }

    shuffledDeck.forEach(card => {
      const { suit, value } = card

      suits[suit]++
      values[value]++
    })

    // Assertions for even distribution of suits
    expect(suits[CardSuitType.Hearts]).toBeCloseTo(shoeSize / 4, -2)
    expect(suits[CardSuitType.Diamonds]).toBeCloseTo(shoeSize / 4, -2)
    expect(suits[CardSuitType.Clubs]).toBeCloseTo(shoeSize / 4, -2)
    expect(suits[CardSuitType.Spades]).toBeCloseTo(shoeSize / 4, -2)

    // Assertions for even distribution of values
    for (const count of Object.values(values)) {
      expect(count).toBeCloseTo(shoeSize / 13, -2)
    }
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Shannon Entropy Calculation - Deck', () => {
    const cardProbDeck = 1 / CARDS_PER_DECK
    const expectedEntropyDeck =
      -Math.log2(cardProbDeck) * cardProbDeck * CARDS_PER_DECK

    const deck = getProvableShoe(getRandomSeed(), 1)
    const entropyDeck = calculateShannonEntropy(deck)

    // Assert that the deck entropy is within an acceptable range
    expect(entropyDeck).toBeCloseTo(expectedEntropyDeck, 10)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Shannon Entropy Calculation - Shoe', () => {
    const cardProbShoe = 1 / MAX_SHOE_SIZE
    const expectedEntropyShoe =
      -Math.log2(cardProbShoe) * cardProbShoe * MAX_SHOE_SIZE

    const shoe = getProvableShoe(getRandomSeed())
    const entropyDeck = calculateShannonEntropy(shoe)

    // Assert that the deck entropy is within an acceptable range
    expect(entropyDeck).toBeCloseTo(expectedEntropyShoe, 10)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Shannon Entropy Calculation - 1k Shoes', () => {
    const numShoes = 1000
    const cardProbShoe = 1 / MAX_SHOE_SIZE
    const expectedEntropyShoe =
      -Math.log2(cardProbShoe) * cardProbShoe * MAX_SHOE_SIZE

    let totalEntropy = 0
    const generateShoe = () => getProvableShoe(getRandomSeed())
    for (let i = 0; i < numShoes; i++) {
      const shoe = generateShoe() // Generate a new deck for each iteration
      const entropy = calculateShannonEntropy(shoe) // Calculate entropy for the current deck
      totalEntropy += entropy // Aggregate the entropy values
    }
    const averageEntropy = totalEntropy / numShoes // Calculate the average entropy

    // Assert that the average entropy is within an acceptable range
    expect(averageEntropy).toBeCloseTo(expectedEntropyShoe, 10)
  })
})

/**
 * Calculate the Shannon Entropy for a given array of cards.
 * @param deck The array of cards.
 * @returns The Shannon Entropy value.
 */
function calculateShannonEntropy(deck: Card[]): number {
  // Initialize a map to store the frequency of each card index
  const indexFrequencyMap: Map<number, number> = new Map<number, number>()

  // Calculate the frequency of each card index
  for (let i = 0; i < deck.length; i++) {
    const index = i
    if (indexFrequencyMap.has(index)) {
      indexFrequencyMap.set(index, indexFrequencyMap.get(index)! + 1)
    } else {
      indexFrequencyMap.set(index, 1)
    }
  }

  // Calculate the Shannon Entropy
  let entropy = 0
  const totalCards = deck.length
  for (const frequency of indexFrequencyMap.values()) {
    const probability = frequency / totalCards
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}
