import { type User } from 'src/modules/user/types/User'
import { type Card } from './cards'
import {
  BLACKJACK_DEMO_BET,
  BLACKJACK_MAXI_BET,
  BLACKJACK_MAXI_BET_21_PLUS_3,
  BLACKJACK_MAXI_BET_PERFECT_PAIR,
  BLACKJACK_MINI_BET,
  BLACKJACK_MINI_BET_21_PLUS_3,
  BLACKJACK_MINI_BET_PERFECT_PAIR,
  DEALER_ID,
} from './constants'

/**
 * The valid hand actions.
 */
export enum HandActionType {
  Deal = 0,
  Hit = 1,
  Stand = 2,
  DoubleDown = 3,
  Split = 4,
  // Surrender = 5,
  Insurance = 6,
  // EvenMoney = 7,
}

/**
 * Gets the name of a {@link HandActionType} by it's numeric value.
 * @param value The numeric value of the {@link HandActionType}.
 * @returns The name of the {@link HandActionType}, or `undefined` if not found.
 */
export function getHandActionTypeName(value: number): string | undefined {
  const entries = Object.entries(HandActionType)
  for (const [name, enumValue] of entries) {
    if (enumValue === value) {
      return name
    }
  }
  return undefined // or any other fallback value you prefer
}

/**
 * The valid hand action values.
 */
export const HandActionTypeValues = Object.values(HandActionType)
  .map(key => Number(key))
  .filter(key => !isNaN(key))

/**
 * The valid game statuses.
 */
export enum GameStatus {
  Pending = 'pending',
  Active = 'active',
  Complete = 'complete',
  Rejected = 'rejected',
}

/**
 * The valid game status values.
 */
export const GameStatuses = Object.values(GameStatus)

/**
 * The valid hand wager types.
 */
export enum HandWagerType {
  Main = 'main',
  Insurance = 'insurance',
  PerfectPair = 'perfect-pair',
  TwentyOnePlusThree = 'twenty-one-plus-three',
}

/**
 * The hand wager types with static configuration.
 */
type StaticConfigWagerTypes = Exclude<HandWagerType, HandWagerType.Insurance>

/**
 * The valid hand wager types.
 */
export const HandWagerTypes = Object.values(HandWagerType)

/**
 * The wager configuration type.
 */
export type WagerConfigType = Record<
  StaticConfigWagerTypes,
  { amount: { min: number; max: number; demo: number } }
>

/**
 * Configuration for each {@link HandWagerType}.
 */
export const WagerConfig: WagerConfigType = {
  [HandWagerType.Main]: {
    amount: {
      min: BLACKJACK_MINI_BET,
      max: BLACKJACK_MAXI_BET,
      demo: BLACKJACK_DEMO_BET,
    },
  },
  [HandWagerType.PerfectPair]: {
    amount: {
      min: BLACKJACK_MINI_BET_PERFECT_PAIR,
      max: BLACKJACK_MAXI_BET_PERFECT_PAIR,
      demo: BLACKJACK_DEMO_BET,
    },
  },
  [HandWagerType.TwentyOnePlusThree]: {
    amount: {
      min: BLACKJACK_MINI_BET_21_PLUS_3,
      max: BLACKJACK_MAXI_BET_21_PLUS_3,
      demo: BLACKJACK_DEMO_BET,
    },
  },
}

/**
 * The valid hand side wager types.
 */
export const HandSideWagerTypes = Object.values(HandWagerType).filter(
  type => type !== HandWagerType.Main,
)

/**
 * The valid hand wager outcomes.
 */
export enum WagerOutcomeType {
  Win = 'win',
  Loss = 'loss',
  Draw = 'draw',
  Unknown = 'unknown',
}

/**
 * The valid game status values.
 */
export const WagerOutcomeTypes = Object.values(WagerOutcomeType)

/**
 * A card dealt to a player.
 */
export interface PlayerCard extends Card {
  hidden: boolean
}

/**
 * The valid hand outcome types.
 */
export enum HandOutcomeType {
  Win = 'win',
  Loss = 'loss',
  Push = 'push',
  Unknown = 'unknown',
}

/**
 * The valid card suits.
 */
export const HandOutcomeTypes = Object.values(HandOutcomeType)

/**
 * The status of a hand of cards, including its value,
 * bust or blackjack, and possible action indicators.
 */
export interface HandStatus {
  value: number // This should be between 0 and 30 and ALWAYS an integer.
  isHard: boolean
  isSoft: boolean
  isBust: boolean
  isBlackjack: boolean
  canHit: boolean
  canStand: boolean
  canInsure: boolean
  canSplit: boolean
  canDoubleDown: boolean
  splitFrom: number | null
  wasDoubled: boolean
  outcome: HandOutcomeType
}

/**
 * The default hand status used prior to the first deal.
 */
export const HandStatusDefault: HandStatus = {
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
}

/**
 * The base hand action type.
 */
export interface BaseHandAction<T extends HandActionType> {
  type: T
  timestamp: Date
}

/**
 * The action of a player being dealt their hand.
 */
export interface HandActionDeal extends BaseHandAction<HandActionType.Deal> {
  shoeIndex: number
}

/**
 * The action of a player hitting their hand.
 */
export interface HandActionHit extends BaseHandAction<HandActionType.Hit> {
  shoeIndex: number
}

/**
 * The action of a player doubling down on their hand.
 */
export interface HandActionDoubleDown
  extends BaseHandAction<HandActionType.DoubleDown> {
  shoeIndex: number
}

/**
 * The action of a player insuring their hand, or not.
 */
export interface HandActionInsurance
  extends BaseHandAction<HandActionType.Insurance> {
  accept: boolean
}

/**
 * Determines if the {@link action} is a {@link HandActionInsurance} or not.
 * @param action The {@link HandAction} to check.
 * @returns `true` if the {@link action} is a {@link HandActionInsurance}, `false` otherwise.
 */
export function isHandActionInsurance(
  action: HandAction<any>,
): action is HandActionInsurance {
  return action.type === HandActionType.Insurance
}

/**
 * The action of a player splitting their hand.
 */
export interface HandActionSplit extends BaseHandAction<HandActionType.Split> {
  splitTo: number
  splitFrom: number
}

/**
 * The action of a player standing their hand.
 */
export interface HandActionStand extends BaseHandAction<HandActionType.Stand> {}

/**
 * Determines if the {@link action} is a {@link HandActionStand} or not.
 * @param action The {@link HandAction} to check.
 * @returns `true` if the {@link action} is a {@link HandActionStand}, `false` otherwise.
 */
export function isHandActionStand(
  action: HandAction<any>,
): action is HandActionStand {
  return action.type === HandActionType.Stand
}

/**
 * The valid hand actions.
 */
export type HandActions =
  | HandActionDeal
  | HandActionHit
  | HandActionInsurance
  | HandActionSplit
  | HandActionStand
  | HandActionDoubleDown

/**
 * Determines if a value is a valid {@link HandAction}.
 * @param action The value to check.
 * @returns `true` if the value is a valid {@link HandAction}, `false` otherwise.
 */
export function isValidAction(action: any): action is HandActions {
  return action.type in HandActionType
}

/**
 * The valid hand actions with a shoe index.
 */
export type HandActionWithShoe =
  | HandActionDeal
  | HandActionHit
  | HandActionDoubleDown

/**
 * Determines if a {@link HandAction} has a shoe index or not.
 * @param action The {@link HandAction} to check.
 * @returns `true` if the {@link HandAction} has a shoe index, `false` otherwise.
 */
export function isHandActionWithShoe(
  action: HandAction<any>,
): action is HandActionWithShoe {
  return (
    action.type === HandActionType.Deal || action.type === HandActionType.Hit
  )
}

/**
 * The meta data for each {@link HandActionType}.
 */
export interface HandActionMeta {
  [HandActionType.Deal]: Omit<HandActionDeal, 'type' | 'timestamp'>
  [HandActionType.Hit]: Omit<HandActionHit, 'type' | 'timestamp'>
  [HandActionType.Split]: Omit<HandActionSplit, 'type' | 'timestamp'>
  [HandActionType.Stand]: Omit<HandActionStand, 'type' | 'timestamp'>
  [HandActionType.Insurance]: Omit<HandActionInsurance, 'type' | 'timestamp'>
  [HandActionType.DoubleDown]: Omit<HandActionDoubleDown, 'type' | 'timestamp'>
}

/**
 * The valid hand action types.
 */
export type HandAction<T extends HandActionType> = BaseHandAction<T> &
  (HandActionMeta[T] extends never ? object : HandActionMeta[T])

/**
 * Convenience type to shorten a signature.
 */
export type MakeActionMeta<T extends HandActionType> =
  HandActionMeta[T] extends never ? Record<string, never> : HandActionMeta[T]

/**
 * A hand of cards.
 */
export interface Hand {
  handIndex: number
  cards: PlayerCard[]
  status?: HandStatus
  actions: HandActions[] // High-end scenario: 75 actions
}

/**
 * A hand of cards with a status.
 */
export interface HandWithStatus extends Hand {
  status: HandStatus
}

/**
 * A hand of cards with a status and wager.
 */
export interface PlayerHand extends HandWithStatus {
  wager: UserHandMainWager
}

/**
 * A hand of cards with a status and wager with side bets.
 */
export interface PlayerHandWithSides extends PlayerHand {
  wager: UserHandMainWagerWithSides
}

/**
 * Determines if a hand is a {@link PlayerHand}, or not.
 * @param hand The {@link Hand} to check.
 * @returns `true` if the hand is a {@link PlayerHand}, `false` otherwise.
 */
export function isPlayerHand(hand: Hand): hand is PlayerHand {
  return isHandWithStatus(hand) && 'wager' in hand && !!hand.wager
}

/**
 * Determines if a hand is a {@link HandWithStatus}, or not.
 * @param hand The {@link Hand} to check.
 * @returns `true` if the hand is a {@link HandWithStatus}, `false` otherwise.
 */
export function isHandWithStatus(hand: Hand): hand is HandWithStatus {
  return !!hand && !!hand.status
}

/**
 * A players request for betting hands.
 */
export interface PlayerSeatRequest {
  playerId: string
  betId?: string
  seatIndex?: number
  clientSeed?: string
  wagers: UserHandMainWagerRequest[]
}

/**
 * Determines if a seat is a {@link PlayerSeatRequest} or not.
 * @param seat The seat to check.
 * @returns `true` if the seat is a {@link PlayerSeatRequest}, `false` otherwise.
 */
export function isPlayerSeatRequest(seat: any): seat is PlayerSeatRequest {
  return (
    !!seat &&
    !!seat.playerId &&
    !!seat.wagers &&
    Array.isArray(seat.wagers) &&
    seat.wagers.every((wager: any) => isUserHandMainWagerRequest(wager))
  )
}

/**
 * The base user hand wager type.
 */
export interface BaseUserHandWager {
  type: HandWagerType
  amount: number
}

/**
 * Valid user hand wager types.
 */
export type UserHandWager = UserHandMainWager | UserHandSideWager

/**
 * A users side-wager on a {@link UserMainWager}.
 */
export interface UserHandSideWager extends BaseUserHandWager {
  type: Exclude<HandWagerType, HandWagerType.Main>
  outcome: WagerOutcomeType
}

/**
 * A users Perfect Pairs wager on a {@link UserMainWager}.
 */
export interface UserHandPerfectPairsWager extends UserHandSideWager {
  type: HandWagerType.PerfectPair
}

/**
 * A users 21+3 wager on a {@link UserMainWager}.
 */
export interface UserHand21Plus3Wager extends UserHandSideWager {
  type: HandWagerType.TwentyOnePlusThree
}

/**
 * A users insurance wager on a {@link UserMainWager}.
 */
export interface UserHandInsuranceWager extends UserHandSideWager {
  type: HandWagerType.Insurance
}

/**
 * Determines if a wager is a {@link UserHandInsuranceWager}.
 * @param wager The {@link UserHandSideWager} to check.
 * @returns `true` if the wager is a {@link UserHandInsuranceWager}, `false` otherwise.
 */
export function isInsuranceWager(
  wager: UserHandSideWager,
): wager is UserHandInsuranceWager {
  return wager.type === HandWagerType.Insurance
}

/**
 * Valid side wager types.
 *
 * Amend this with new side wager types as they are added.
 */
export type WagerTypes =
  | UserHandPerfectPairsWager
  | UserHand21Plus3Wager
  | UserHandInsuranceWager

type UniqueWagerArray<T extends UserHandSideWager> = {
  [K in T['type']]: T extends { type: K } ? T : never
}

/**
 * Restrict to one of each wager type regardless of order.
 */
export type UserHandWagers =
  | Array<UniqueWagerArray<WagerTypes>[keyof UniqueWagerArray<WagerTypes>]>
  | never[]

/**
 * Determines if a {@link UserHandWagers} is resolved to an outcome, or not.
 * @param wager The {@link UserHandWagers} to check.
 * @returns `true` if the wager is resolved, `false` otherwise.
 */
export function isUnresolvedSideWager(wager: UserHandSideWager): boolean {
  return (
    !!wager &&
    (wager.outcome === undefined ||
      wager.outcome === null ||
      wager.outcome === WagerOutcomeType.Unknown)
  )
}

/**
 * A users main wager on a hand.
 */
export interface UserHandMainWagerRequest extends BaseUserHandWager {
  type: HandWagerType.Main
  sides?: UserHandWagers
  handIndex?: number
}

/**
 * Determines if a wager is a {@link UserHandMainWagerRequest}, or not.
 * @param wager The wager to check.
 * @returns `true` if the wager is a {@link UserHandMainWagerRequest}, `false` otherwise.
 */
export function isUserHandMainWagerRequest(
  wager: any,
): wager is UserHandMainWagerRequest {
  return (
    !!wager &&
    wager.type === HandWagerType.Main &&
    'amount' in wager &&
    typeof wager.amount === 'number' &&
    ((wager.amount >= WagerConfig[HandWagerType.Main].amount.min &&
      wager.amount <= WagerConfig[HandWagerType.Main].amount.max) ||
      wager.amount === WagerConfig[HandWagerType.Main].amount.demo)
  )
}

/**
 * A users main wager on a hand.
 */
export interface UserHandMainWager extends BaseUserHandWager {
  type: HandWagerType.Main
  sides?: UserHandWagers
}

/**
 * A users main wager on a hand with side wagers.
 */
export interface UserHandMainWagerWithSides extends UserHandMainWager {
  sides: UserHandWagers
}

/**
 * Determines if a wager is a {@link UserHandMainWagerWithSides}, or not.
 * @param wager The {@link UserHandMainWager} to check.
 * @returns `true` if the wager is a {@link UserHandMainWagerWithSides}, `false` otherwise.
 */
export function isUserHandMainWagerWithSides(
  wager: UserHandWager | UserHandMainWager | UserHandMainWagerRequest,
): wager is UserHandMainWagerWithSides {
  return (
    !!wager &&
    wager.type === HandWagerType.Main &&
    !!wager.sides &&
    wager.sides.length > 0
  )
}

/**
 * A users request for betting hands.
 */
export interface UserSeatRequest {
  user: User
  seatIndex?: number
  clientSeed?: string
  wagers: UserHandMainWagerRequest[]
}

/**
 * The default dealer wager.
 */
export const DefaultWager: UserHandMainWager = {
  type: HandWagerType.Main,
  amount: 0,
  sides: [],
}

/**
 * The state of a player seat with multiple hands.
 */
export interface PlayerSeat {
  playerId: string
  betId?: string
  seatIndex?: number
  hands: PlayerHand[]
}

/**
 * The state of a player seat with multiple hands and live wagers.
 */
export interface PlayerSeatWithLiveWager extends PlayerSeat {
  betId: string
}

/**
 * The state of a player seat with multiple hands and live wagers with side bets.
 */
export interface PlayerSeatWithLiveWagerAndSide extends PlayerSeat {
  betId: string
  hands: PlayerHandWithSides[]
}

/**
 * Determines if a seat is a {@link PlayerSeatWithLiveHandWagers} or not.
 * @param seat The {@link PlayerSeat } to check.
 * @returns `true` if the seat is a {@link PlayerSeatWithLiveHandWagers}, `false` otherwise.
 */
export function isPlayerSeatWithLiveHandWagers(
  seat: PlayerSeat | DealerSeat,
): seat is PlayerSeatWithLiveWager {
  return (
    !!seat &&
    'betId' in seat &&
    !!seat.betId &&
    seat.betId.length > 0 &&
    seat.hands.length > 0 &&
    seat.hands.some(
      hand => hand.wager && hand.wager.amount > BLACKJACK_MINI_BET,
    )
  )
}

/**
 * Determines if a seat is a {@link PlayerSeatWithLiveWagerAndSide} or not.
 * @param seat The {@link PlayerSeat } to check.
 * @returns `true` if the seat is a {@link PlayerSeatWithLiveWagerAndSide}, `false` otherwise.
 */
export function isPlayerSeatWithLiveHandWagersWithSides(
  seat: PlayerSeat | DealerSeat,
): seat is PlayerSeatWithLiveWagerAndSide {
  return (
    isPlayerSeatWithLiveHandWagers(seat) &&
    seat.hands.every(hand => isUserHandMainWagerWithSides(hand.wager))
  )
}

/**
 * Determines if a seat is a {@link PlayerSeat} or not.
 * @param seat The {@link PlayerSeat } to check.
 * @returns `true` if the seat is a {@link PlayerSeat}, `false` otherwise.
 */
export function isPlayerSeat(seat: object): seat is PlayerSeat {
  return (
    !!seat &&
    'playerId' in seat &&
    seat.playerId !== DEALER_ID &&
    'hands' in seat &&
    Array.isArray(seat.hands)
  )
}

/**
 * The state of the dealer seat with a single hand.
 */
export interface DealerSeat {
  playerId: typeof DEALER_ID
  hands: [Hand] | []
}

/**
 * The state of the active dealer seat with a single hand.
 */
export interface DealerSeatActive extends DealerSeat {
  playerId: typeof DEALER_ID
  hands: [Hand]
}

/**
 * Determines if a seat is a {@link DealerSeatActive active dealer seat} or not.
 * @param seat The {@link DealerSeat } to check.
 * @returns `true` if the seat is a {@link DealerSeatActive}, `false` otherwise.
 */
export function isDealerSeatActive(seat: DealerSeat): seat is DealerSeatActive {
  return !!seat && seat.playerId === DEALER_ID && seat.hands.length > 0
}

/**
 * Determines if a seat is a {@link DealerSeat} or not.
 * @param seat The {@link DealerSeat } or {@link PlayerSeat} to check.
 * @returns `true` if the seat is a {@link DealerSeat}, `false` otherwise.
 */
export function isDealerSeat(
  seat: PlayerSeat | DealerSeat,
): seat is DealerSeat {
  return !!seat && seat.playerId === DEALER_ID
}

/**
 * A default dealer seat for pending games.
 */
export const DealerSeatDefault: DealerSeat = {
  playerId: 'dealer',
  hands: [{ handIndex: 0, status: HandStatusDefault, actions: [], cards: [] }],
}

/**
 * Multiple players terminated by a dealer.
 */
export type Table = [...PlayerSeat[], DealerSeat]

/**
 * The state of a blackjack game.
 */
export interface GameState {
  id: string
  /**
   * Seed for the final game hash for shuffling the deck.
   *
   * IMPORTANT: NEVER SEND THIS TO THE CLIENT UNTIL THE GAME IS COMPLETE!
   *
   * `const canSendSeed = game.status === GameStatus.Complete`
   */
  seed: string
  hash?: string
  status: GameStatus
  players: Table
}

/**
 * The recognized wager groups.
 */
export type BlackjackWagerGroup = 'demo' | 'dead' | 'live'

/**
 * The player hash ingredients for a game round.
 */
export interface PlayerHashParts {
  nonce: number
  roundHash: string
  clientSeed: string
}

/**
 * The hashes for a game round.
 */
export interface GameRoundHashes {
  gameRoundHash: string
  playerRoundHashes: string[]
}

/**
 * Options for creating Blackjack games.
 */
export interface CreateGameOptions {
  hashOverride?: string
}
