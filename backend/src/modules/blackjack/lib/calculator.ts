import { Decimal } from 'decimal.js'
import {
  CardAltValueType,
  CardValueType,
  HandActionType,
  HandOutcomeType,
  MAX_HAND_VALUE,
  getCardSuitColor,
  isHandActionStand,
  isHandWithStatus,
  isNotAnAceCard,
  type Card,
  type Hand,
  type HandActions,
  type HandStatus,
  isHandActionInsurance,
} from '../types'
import { isPlayableHand } from '../utils'

/**
 * Gets the alternate value of a {@link Card} if it has one, otherwise is normal value.
 * @param card The {@link Card} for which to get the value.
 * @returns The {@link number} value of the card.
 */
export function getCardAltValue(card: Card): number {
  const value = card.value
  const altValue = Object.entries(CardAltValueType).find((key, value) => {
    return [...key, value].includes(CardValueType[card.value])
  })?.[0]
  return altValue ? Number(altValue) : value
}

/**
 * Get the absolute card-value of a hand of cards as interpreted through
 * possible alternate values depending on the contents of the hand.
 * @param cards An array of {@link Card} instances in a hand.
 * @param useAlts Indicates if alternate values should be used or not (default: `true`).
 * @returns The absolute card-value of the hand.
 */
export function getHandValue(cards: Card[], useAlts = true): number {
  return [...cards]
    .sort((a, b) => a.value - b.value)
    .reduce((total, card) => {
      const cardAltValue = useAlts ? getCardAltValue(card) : 0
      const cardValue =
        total + Math.floor(card.value) > MAX_HAND_VALUE
          ? cardAltValue
          : card.value
      return total + Math.floor(cardValue)
    }, 0)
}

/**
 * Indicates if the {@link cards} if the cards are considered a hard hand or not.
 * @param value The value of the hand.
 * @param cards The {@link Card} instances in the hand.
 * @returns `true` if the hand is considered hard, otherwise false.
 */
const statIsHard = (value: number, cards: Card[]): boolean =>
  value <= MAX_HAND_VALUE &&
  (cards.every(card => card.value !== CardValueType.Ace) ||
    (cards.some(card => card.value === CardValueType.Ace) &&
      value - CardAltValueType.Ace === getHandValue(cards, false)))

/**
 * Indicates if the {@link cards} are considered a soft hand or not.
 * @param value The value of the hand.
 * @param cards The {@link Card} instances in the hand.
 * @returns `true` if the hand is considered soft, otherwise `false`.
 */
const statIsSoft = (value: number, cards: Card[]): boolean =>
  value <= MAX_HAND_VALUE &&
  cards.some(card => card.value === CardValueType.Ace) &&
  [0, value - CardValueType.Ace].includes(
    getHandValue(cards.filter(isNotAnAceCard)),
  )

/**
 * Indicates if the {@link cards} qualify as busted or not.
 * @param value The value of the hand.
 * @returns `true` if the hand is busted, otherwise `false`.
 */
const statIsBust = (value: number): boolean => value > MAX_HAND_VALUE

/**
 * Indicates if the {@link cards} represent a Blackjack hand or not.
 * @param value The value of the hand.
 * @param cards The {@link Card} instances in the hand.
 * @returns `true` if the hand is a Blackjack, otherwise `false`.
 */
const statIsBlackjack = (value: number, cards: Card[]): boolean =>
  value === MAX_HAND_VALUE && cards.length === 2

/**
 * Indicates if the {@link cards} qualify to hit the hand or not.
 * @param value The value of the hand.
 * @returns `true` if the hand can be hit, otherwise `false`.
 */
const statCanHit = (value: number, actions: HandActions[]): boolean =>
  value < MAX_HAND_VALUE && actions.find(isHandActionStand) === undefined

/**
 * Indicates if the {@link cards} qualify to stand the hand or not.
 * @param value The value of the hand.
 * @returns `true` if the hand can stand, otherwise `false`.
 */
const statCanStand = (value: number, actions: HandActions[]): boolean =>
  value < MAX_HAND_VALUE && actions.find(isHandActionStand) === undefined

/**
 * Indicates if the Dealer {@link cards} qualify for insurance or not.
 * @param cards The {@link Card} instances in the Dealer's hand.
 * @returns `true` if the hand qualifies players for insurance, otherwise `false`.
 */
const statCanInsure = (cards: Card[], playerActions: HandActions[]): boolean =>
  cards.length === 2 &&
  cards[0].value === CardValueType.Ace &&
  playerActions.find(isHandActionInsurance) === undefined

/**
 * Indicates if the {@link cards} qualify to split the hand or not.
 * @param cards The {@link Card} instances in the hand.
 * @returns `true` if the hand can be split, otherwise `false`.
 */
const statCanSplit = (cards: Card[], actions: HandActions[]): boolean =>
  cards.length === 2 &&
  cards[0].value === cards[1].value &&
  actions.length === 2 &&
  actions.every(action => action.type === HandActionType.Deal)

/**
 * Indicates if the {@link cards} qualify to double-down the hand or not.
 * @param cards The {@link Card} instances in the hand.
 * @returns `true` if the hand can be double-downed, otherwise `false`.
 */
const statCanDoubleDown = (cards: Card[], actions: HandActions[]): boolean =>
  cards.length === 2 && actions.find(isHandActionStand) === undefined

/**
 * Get the status of a hand of {@link playerCards}.
 * @param cards An array of {@link Card} instances in a hand.
 * @returns The {@link HandStatus} of the hand.
 */
export function getHandStatus(hand: Hand, dealer: Hand): HandStatus {
  const { cards: playerCards, actions: playerActions } = hand
  const isDealer = hand === dealer
  const dealerCards = dealer.cards
  const value = getHandValue(playerCards)
  const basicStatus = {
    value,
    isHard: statIsHard(value, playerCards),
    isSoft: statIsSoft(value, playerCards),
    isBust: statIsBust(value),
    isBlackjack: statIsBlackjack(value, playerCards),
    canHit: statCanHit(value, playerActions),
    canStand: statCanStand(value, playerActions),
    canInsure: statCanInsure(dealerCards, playerActions),
    canSplit: statCanSplit(playerCards, playerActions),
    canDoubleDown: statCanDoubleDown(playerCards, playerActions),
    splitFrom: hand.status?.splitFrom ?? null, // Keep it once it's assigned
    wasDoubled: !!hand.actions.find(
      action => action.type === HandActionType.DoubleDown,
    ),
    outcome: HandOutcomeType.Unknown,
  } satisfies HandStatus
  const projectedHand = { ...hand, status: basicStatus }
  const isDealerPlayable = isPlayableHand(dealer, true)
  const isNotPlayable =
    !isPlayableHand(projectedHand, isDealer) || !isDealerPlayable
  const outcome =
    isNotPlayable && !isDealer
      ? getHandOutcome(projectedHand, dealer)
      : HandOutcomeType.Unknown

  return {
    ...basicStatus,
    outcome,
  }
}

/**
 * Get the outcome of the {@link player player's} {@link Hand} against the {@link dealer dealer's} {@link HandW}.
 * @param player The player's {@link Hand}.
 * @param dealer The dealer's {@link Hand}.
 * @returns The {@link HandOutcomeType} of the player's hand against the dealer's hand, if each has a valid {@link Hand.status status}, otherwise {@link HandOutcomeType.Unknown}.
 */
export function getHandOutcome(player: Hand, dealer: Hand): HandOutcomeType {
  if (!isHandWithStatus(player) || !isHandWithStatus(dealer)) {
    return HandOutcomeType.Unknown
  }

  const {
    status: {
      isBlackjack: dealerIsBlackjack,
      isBust: dealerIsBust,
      value: dealerValue,
    },
  } = dealer
  const {
    status: {
      isBlackjack: playerIsBlackjack,
      isBust: playerIsBust,
      value: playerValue,
    },
  } = player

  // Solve for `player` not `dealer` because every game is against the `dealer`.
  if (playerIsBust) return HandOutcomeType.Loss
  if (!playerIsBust && dealerIsBust) return HandOutcomeType.Win
  if (playerIsBlackjack && dealerIsBlackjack) return HandOutcomeType.Push
  if (dealerIsBlackjack && !playerIsBlackjack) return HandOutcomeType.Loss
  if (playerIsBlackjack && !dealerIsBlackjack) return HandOutcomeType.Win
  if (playerValue > dealerValue && !playerIsBust) return HandOutcomeType.Win
  if (playerValue === dealerValue && !dealerIsBust && !playerIsBust)
    return HandOutcomeType.Push
  if (playerValue < dealerValue && !dealerIsBust) return HandOutcomeType.Loss

  return HandOutcomeType.Unknown
}

/**
 * Determines if the {@link cards} are a `Perfect Pair` hand.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Perfect Pair` hand, otherwise `false`.
 */
export function isPerfectPair(cards: Card[]): boolean {
  return [isPrefectPairTrue, isPrefectPairColored, isPerfectPairMixed].some(
    fn => fn(cards),
  )
}

/**
 * Determines if the {@link cards} are a truly `Perfect Pair`, or not.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a truly `Perfect Pair`, otherwise `false`.
 */
export function isPrefectPairTrue(cards: Card[]): boolean {
  return cards.every(
    card => card.value === cards[0].value && card.suit === cards[0].suit,
  )
}

/**
 * Determines if the {@link cards} are a `Colored Pair`, or not.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Colored Pair`, otherwise `false`.
 */
export function isPrefectPairColored(cards: Card[]): boolean {
  return cards.every(
    card =>
      card.value === cards[0].value &&
      getCardSuitColor(card.suit) === getCardSuitColor(cards[0].suit),
  )
}

/**
 * Determines if the {@link cards} are a `Mixed Pair`, or not.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Mixed Pair`, otherwise `false`.
 */
export function isPerfectPairMixed(cards: Card[]): boolean {
  const firstValue = cards[0].value
  const firstColor = getCardSuitColor(cards[0].suit)
  const allValueMatch = cards.every(card => card.value === firstValue)
  const allColorMatch = cards.every(
    card => getCardSuitColor(card.suit) === firstColor,
  )
  return allValueMatch && !allColorMatch
}

/**
 * Determines if the {@link cards} are a `23+1` hand.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `23+1` hand, otherwise `false`.
 */
export function is21Plus3(cards: Card[]): boolean {
  return [
    isSuited3OfAKind,
    isStraightFlush,
    isThreeOfAKind,
    isStraight,
    isFlush,
  ].some(fn => fn(cards))
}

/**
 * Determines if the {@link cards} are a `Suited Three of a Kind`.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Suited Three of a Kind`, otherwise `false`.
 */
export function isSuited3OfAKind(cards: Card[]): boolean {
  return (
    cards.length === 3 &&
    cards.every(card => card.suit === cards[0].suit) &&
    cards.every(card => card.value === cards[0].value)
  )
}

/**
 * Determines if the {@link cards} are a `Straight Flush`.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Straight Flush`, otherwise `false`.
 */
export function isStraightFlush(cards: Card[]): boolean {
  return (
    cards.length === 3 &&
    cards.every(card => card.suit === cards[0].suit) &&
    [...cards]
      .sort((a, b) => a.value - b.value)
      .every((card, index, sorted) => {
        const cardValues = [card.value, getCardAltValue(card)] // Should be [n, n] or [1, 11]
        return index === 0 || cardValues.includes(sorted[index - 1].value + 1)
      })
  )
}

/**
 * Determines if the {@link cards} are a `Three of a Kind`.
 * @param cards The {@link Card} instances to evaluate.
 * @returns `true` if the cards are a `Three of a Kind`, otherwise `false`.
 */
export function isThreeOfAKind(cards: Card[]): boolean {
  return (
    cards.length === 3 && cards.every(card => card.value === cards[0].value)
  )
}

/**
 * Determines if the cards are a `Straight`.
 * @param cards The cards to evaluate.
 * @returns `true` if the cards are a `Straight`, otherwise `false`.
 */
export function isStraight(cards: Card[]): boolean {
  const maybeRollFract = (value: Decimal): Decimal =>
    value.gt(new Decimal(CardValueType.King))
      ? new Decimal(CardValueType.Ace)
      : value

  return (
    cards.length === 3 &&
    [...cards]
      .sort((a, b) => a.value - b.value)
      .every((card, index, sorted) => {
        const isFirst = index === 0
        if (isFirst) return true

        const cardValuesWhole = [card.value, getCardAltValue(card)] // Should be [n, n] or [1, 11]
        const expectWhole = sorted[index - 1].value + 1
        const matchesWhole = cardValuesWhole.includes(expectWhole)

        const cardValuesFract = [
          new Decimal(card.value),
          new Decimal(getCardAltValue(card)),
        ] // Should be [n.n, n.n] or [10.1, 10.1]
        const expectFract = maybeRollFract(
          new Decimal(sorted[index - 1].value).plus(0.1),
        )
        const matchesFract = cardValuesFract.some(value =>
          value.equals(expectFract),
        )

        return matchesWhole || matchesFract
      })
  )
}

/**
 * Determines if the cards are a `Flush`.
 * @param cards The cards to evaluate.
 * @returns `true` if the cards are a `Flush`, otherwise `false`.
 */
export function isFlush(cards: Card[]): boolean {
  return cards.length === 3 && cards.every(card => card.suit === cards[0].suit)
}
