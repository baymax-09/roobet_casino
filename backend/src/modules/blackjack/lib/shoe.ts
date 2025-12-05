import { buildGroup } from 'src/modules/game/lib/shuffle'
import {
  CardSuitTypes,
  DECKS_PER_SHOE,
  getCardRanks,
  type Card,
} from '../types'

/**
 * Gets a provable shoe of cards.
 * @param seed The seed to use for the shoe.
 * @returns A provably fair shoe of cards.
 */
export function getProvableShoe(
  seed: string,
  deckCount = DECKS_PER_SHOE,
): Card[] {
  const shuffleCount = 1
  let cards = generateDeck(deckCount)
  for (let i = 0; i < shuffleCount; i++) {
    cards = shuffleCards(seed, cards)
  }
  return cards
}

/**
 * Shuffles a deck of cards based on the provided {@link seed}.
 * @param seed The provability seed.
 * @param cards The cards to shuffle.
 * @returns The shuffled cards.
 */
function shuffleCards(seed: string, cards: Card[]): Card[] {
  return buildGroup(cards.length, seed).map(index => cards[index])
}

/**
 * Gets an un-shuffled deck of cards.
 * @param decks The number of decks to use.
 * @returns A un-shuffled deck of cards.
 */
function generateDeck(decks: number): Card[] {
  const deck: Card[] = []
  const cardRanks = getCardRanks()
  for (let indecks = 0; indecks < decks; indecks++) {
    for (const suit of CardSuitTypes) {
      for (const value of cardRanks) {
        deck.push({ suit, value })
      }
    }
  }
  return deck
}
