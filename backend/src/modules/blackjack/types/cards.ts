/**
 * The valid card suits.
 */
export enum CardSuitType {
  Hearts = 'Hearts',
  Diamonds = 'Diamonds',
  Clubs = 'Clubs',
  Spades = 'Spades',
  Hidden = 'Hidden',
}

/**
 * The valid card suits.
 */
export const CardSuitTypes = Object.values(CardSuitType).filter(
  key => key !== CardSuitType.Hidden,
)

/**
 * The valid card values.
 */
export enum CardValueType {
  Hidden = 0,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 10.1,
  Queen = 10.2,
  King = 10.3,
  Ace = 11,
}

/**
 * The valid card values.
 */
export const CardValueTypes = Object.keys(CardValueType)
  .map(key => Number(key))
  .filter(key => !isNaN(key) && key > 0)

/**
 * The valid card alternative values.
 */
export enum CardAltValueType {
  Ace = 1,
}

/**
 * Determine if a card is an {@link CardValueType.Ace} or not.
 * @param card The {@link Card} to check.
 * @returns `true` if the card is an ace, otherwise `false`.
 */
export function isNotAnAceCard(card: Card): boolean {
  return card.value !== CardValueType.Ace
}

/**
 * A card in the blackjack game.
 */
export interface Card {
  suit: CardSuitType
  value: CardValueType
}

/**
 * Gets the numeric card ranks.
 * @returns The numeric card ranks.
 */
export function getCardRanks(): number[] {
  return CardValueTypes
}

/**
 * The card colors.
 */
export enum CardColors {
  Red = 'Red',
  Black = 'Black',
}

/**
 * Gets the color of a card based on its suit.
 * @param suit The {@link CardSuitType} of the card.
 * @returns The {@link CardColors} of the card.
 */
export function getCardSuitColor(suit: CardSuitType): CardColors {
  return suit === CardSuitType.Hearts || suit === CardSuitType.Diamonds
    ? CardColors.Red
    : CardColors.Black
}
