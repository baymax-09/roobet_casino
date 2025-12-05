import { getHandStatus } from '../lib'
import { DEALER_HIT_DECISION_VALUE } from '../lib/dealer'
import { getProvableShoe } from '../lib/shoe'
import {
  BlackjackBadTableDealerError,
  BlackjackError,
  BlackjackGameShoeExhaustedError,
  BlackjackInvalidActionError,
  BlackjackInvalidHandError,
  BlackjackInvalidWagersError,
  BlackjackMissingGameHashError,
  BlackjackNoUsableWagerError,
  BlackjackPlayerNotFoundError,
  BlackjackWrongPlayerHandError,
  DEALER_ID,
  GameStatus,
  HandActionType,
  HandWagerType,
  MAX_HAND_VALUE,
  WagerConfig,
  isDealerSeat,
  isDealerSeatActive,
  isHandActionWithShoe,
  isHandWithStatus,
  isPlayerHand,
  isPlayerSeat,
  isUserHandMainWagerWithSides,
  type BlackjackWagerGroup,
  type Card,
  type DealerSeat,
  type DealerSeatActive,
  type GameState,
  type Hand,
  type HandAction,
  type HandActions,
  type MakeActionMeta,
  type PlayerHand,
  type PlayerSeat,
  type Table,
  type UserHandMainWagerRequest,
  type UserHandWager,
  type UserSeatRequest,
} from '../types'

const logScope = 'utils'

/**
 * Calculates the last used shoe index in a game.
 *
 * Note: Incrementing this value by one gives you the index to the next card to be dealt.
 * @param game The game to calculate the last shoe index for.
 * @returns The last used shoe index as a number.
 */
export function lastShoeIndexFromGame(game: GameState): number {
  return game.players.reduce(
    (pre, cur) =>
      Math.max(
        pre,
        cur.hands.reduce(
          (pre, cur) =>
            Math.max(
              pre,
              cur.actions
                .filter(isHandActionWithShoe)
                .reduce((pre, cur) => Math.max(pre, cur.shoeIndex), 0),
            ),
          0,
        ),
      ),
    0,
  )
}

/**
 * Gets the last player ID and hand index from a {@link GameState}.
 * @param game The {@link GameState} to check.
 */
export function getLastPlayerIdAndHandIndex(game: GameState): {
  lastPlayerId: string
  lastHandIndex: number
} {
  const realPlayers = game.players.filter(isPlayerSeat)
  const lastPlayer = realPlayers[realPlayers.length - 1]
  const lastHandIndex = lastPlayer.hands.length - 1
  return {
    lastPlayerId: lastPlayer.playerId,
    lastHandIndex,
  }
}

/**
 * Gets the {@link DealerSeat} from a {@link Table} or {@link GameState}.
 * @param game The {@link Table} or {@link GameState} to check.
 * @returns The {@link DealerSeat} from the {@link Table} or {@link GameState}.
 * @throws A {@link BlackjackValidationError} if the dealer is not the last player in the game.
 */
export function getTableDealer(tableOrGame: Table | GameState): DealerSeat {
  const table = Array.isArray(tableOrGame) ? tableOrGame : tableOrGame.players
  const gameId = Array.isArray(tableOrGame) ? 'N/A' : tableOrGame.id

  // The dealer is always last, validate that assumption.
  const dealer = table.find(isDealerSeat)
  if (!dealer) {
    throw BlackjackError.logAndReturn(
      new BlackjackBadTableDealerError(gameId, logScope),
    )
  }

  return dealer
}

/**
 * Gets the {@link DealerSeat} from a {@link Table} or {@link GameState}.
 * @param game The {@link Table} or {@link GameState} to check.
 * @returns The {@link DealerSeat} from the {@link Table} or {@link GameState}.
 * @throws A {@link BlackjackValidationError} if the dealer is not the last player in the game.
 */
export function getTableDealerActive(
  tableOrGame: Table | GameState,
): DealerSeatActive {
  const gameId = Array.isArray(tableOrGame) ? 'N/A' : tableOrGame.id
  const dealer = [getTableDealer(tableOrGame)].find(isDealerSeatActive)
  if (!dealer) {
    throw BlackjackError.logAndReturn(
      new BlackjackBadTableDealerError(gameId, logScope),
    )
  }

  // Enure an updated status for the dealer
  dealer.hands[0].status = getHandStatus(dealer.hands[0], dealer.hands[0])

  return dealer
}

/**
 * Gets the {@link Hand dealer hand} from the {@link game}.
 * @param game The {@link GameState game} to check.
 * @returns The {@link Hand dealer hand} from the {@link game}.
 */
export function getDealerHand(game: GameState | Table): Hand {
  const gameId = Array.isArray(game) ? 'N/A' : game.id
  const dealer = getTableDealer(game)
  if (isDealerSeatActive(dealer)) {
    // Enure an updated status for the dealer
    dealer.hands[0].status = getHandStatus(dealer.hands[0], dealer.hands[0])
    return dealer.hands[0]
  }
  throw BlackjackError.logAndReturn(
    new BlackjackBadTableDealerError(gameId, logScope),
  )
}

/**
 * Finds the last player ID and hand index from a {@link GameState} for the most recent action.
 * @param game The {@link GameState} to check.
 * @returns The last player ID and hand index.
 */
export function getLastActionPlayerIdAndHandIndex(game: GameState): {
  lastPlayerId: string
  lastHandIndex: number
} {
  let lastPlayerId = ''
  let lastHandIndex = 0
  let lastAction: HandActions | undefined

  for (const player of game.players) {
    for (let hdx = 0; hdx < player.hands.length; hdx++) {
      const hand = player.hands[hdx]
      for (const action of hand.actions) {
        const curTs = getActionTimestamp(action)
        const lastTs = getActionTimestamp(lastAction)
        if (!lastAction || (!!curTs && !!lastTs && curTs >= lastTs)) {
          lastAction = action
          lastPlayerId = player.playerId
          lastHandIndex = hdx
        }
      }
    }
  }

  return {
    lastPlayerId,
    lastHandIndex,
  }
}

/**
 * Gets the last action timestamp from a {@link HandActions}.
 * @param action The {@link HandActions} to check.
 * @returns The last action timestamp as a {@link Date}, or undefined.
 */
export function getActionTimestamp(action?: HandActions): Date | undefined {
  const TIMESTAMP_LENGTH = 10 // 10 digits is the minimum length for a timestamp
  if (!action) {
    return undefined
  }
  const tsValue = action.timestamp
  if (tsValue instanceof Date) {
    return tsValue
  }
  if (typeof tsValue === 'number') {
    return new Date(tsValue)
  }
  if (typeof tsValue === 'string') {
    const unwrapped = (() => {
      const num = parseInt(tsValue, 10)
      const parsed = !isNaN(num) && num.toString().length >= TIMESTAMP_LENGTH
      return parsed ? num : undefined
    })()
    const didUnwrap = unwrapped !== undefined
    return didUnwrap ? new Date(unwrapped) : new Date(Date.parse(tsValue))
  }

  return undefined
}

/**
 * Gets the remaining shoe and the next index to be dealt from a {@link GameState}.
 * @param game The {@link GameState} to check.
 * @returns An object containing the {@link remainingShoe} and the {@link lastShoeIndex} incremented
 * as `nextIndex` to be dealt.
 */
export function getRemainingShoeAndNextIndex(game: GameState): {
  remainingShoe: Card[]
  nextIndex: number
} {
  if (!game.hash) {
    throw BlackjackError.logAndReturn(
      new BlackjackMissingGameHashError(game.id, logScope),
    )
  }

  const lastShoeIndex = lastShoeIndexFromGame(game)
  const nextIndex = lastShoeIndex + 1
  const remainingShoe = getProvableShoe(game.hash).slice(nextIndex)

  if (remainingShoe.length === 0) {
    // Shoes work hard, don't judge ¯\_(ツ)_/¯
    throw BlackjackError.logAndReturn(
      new BlackjackGameShoeExhaustedError(game.id, logScope),
    )
  }

  return {
    remainingShoe,
    nextIndex,
  }
}

/**
 * Makes a timestamped {@link HandAction} object.
 * @param type The {@link HandActionType} to create.
 * @param meta The {@link MakeActionMeta} to use.
 * @returns A timestamped {@link HandAction} object.
 */
export function makeAction<T extends HandActionType>(
  type: T,
  meta: MakeActionMeta<T>,
): HandAction<T> {
  return {
    ...meta,
    type,
    timestamp: new Date(),
  }
}

/**
 * Determines if a {@link Hand hand} is playable or not.
 * @param hand The {@link Hand} to check.
 * @param isDealer `true` if the hand is the dealer's, `false` otherwise.
 * @returns `true` if the {@link Hand} is playable, `false` otherwise.
 */
export function isPlayableHand(hand: Hand, isDealer: boolean) {
  return (
    isHandWithStatus(hand) &&
    !hand.status.isBust &&
    !hand.status.isBlackjack &&
    ((isDealer && hand.status.value <= DEALER_HIT_DECISION_VALUE) ||
      (!isDealer && hand.status.value < MAX_HAND_VALUE)) &&
    (!hand.actions ||
      hand.actions.length === 0 ||
      hand.actions[hand.actions.length - 1].type !== HandActionType.Stand)
  )
}

/**
 * Determines if the table is still active or not.
 * @param table The {@link Table} to check.
 * @returns `true` if the {@link Table} is active, `false` otherwise.
 */
export function isTableActive(table: Table): boolean {
  const dealerHand = getDealerHand(table)
  const isDealerPlayable = isPlayableHand(dealerHand, true)
  const anyPlayerPlayable = table.filter(isPlayerSeat).some(player =>
    player.hands.some(hand => {
      const isPlayable = isPlayableHand(hand, false)
      return isPlayable
    }),
  )
  return anyPlayerPlayable || isDealerPlayable
}

/**
 * Determines if it's the dealers turn or not.
 * @param table The {@link Table} to check.
 * @returns `true` if it's the dealers turn, `false` otherwise.
 */
export function isDealersTurn(table: Table): boolean {
  const dealerHand = getDealerHand(table)
  const canDealerPlay = isPlayableHand(dealerHand, true)
  const canPlayersPlay = table
    .filter(isPlayerSeat)
    .some(player => player.hands.some(hand => isPlayableHand(hand, false)))

  // If the dealer can play and no players can play, it's the dealer's turn.
  return canDealerPlay && !canPlayersPlay
}

/**
 * Gets the active state of a {@link Table}.
 * @param table The {@link Table} to check.
 * @returns `true` if the {@link Table} is active, `false` otherwise.
 */
export function getTableStatus(table: Table): GameStatus {
  const isActive = isTableActive(table)
  return isActive ? GameStatus.Active : GameStatus.Complete
}

/**
 * Set the active state of a game.
 * @param game The game to update.
 * @returns The updated game.
 */
export function setGameStatus(game: GameState): GameState {
  return {
    ...game,
    status: getTableStatus(game.players),
  }
}

/**
 * Checks if a player can play a hand action or not.
 * @param action The {@link HandActionType} to check.
 * @param player The {@link PlayerSeat} to check.
 * @param handIndex The hand index to check.
 * @returns `true` if the player can play the action, `false` otherwise.
 */
export function canPlayHandAction(
  action: HandActionType,
  player: PlayerSeat,
  handIndex: number,
): boolean {
  const { hand } = getPlayerHandByIndex(player, player.playerId, handIndex)
  switch (action) {
    case HandActionType.Hit:
      return hand.status.canHit
    case HandActionType.Split:
      return hand.status.canSplit
    case HandActionType.Stand:
      return hand.status.canStand
    case HandActionType.Insurance:
      return hand.status.canInsure
    case HandActionType.DoubleDown:
      return hand.status.canDoubleDown
    default:
      return false
  }
}

/**
 * Gets the active {@link PlayerSeat.playerId playerId} and {@link PlayerHand.handIndex hand index} from a {@link GameState game}.
 * @param game The {@link GameState} to check.
 * @returns The active {@link PlayerSeat.playerId playerId} and {@link PlayerHand.handIndex hand index}.
 * @example Get the active player ID and hand index:
 * ```typescript
 * const { activePlayerId, activeHandIndex } = getActivePlayerIdAndHandIndex(game)
 * ```
 */
export function getActivePlayerIdAndHandIndex(game: GameState): {
  activePlayerId: string
  activeHandIndex: number
} {
  for (const player of game.players.filter(isPlayerSeat)) {
    for (const hand of player.hands) {
      if (isPlayableHand(hand, false)) {
        return {
          activePlayerId: player.playerId,
          activeHandIndex: hand.handIndex,
        }
      }
    }
  }
  return { activePlayerId: DEALER_ID, activeHandIndex: 0 }
}

/**
 * Validates a player hand action.
 * @param game The {@link GameState} to check.
 * @param playerId The ID of the player playing.
 * @param handIndex The hand index for the action.
 * @param action The {@link HandActionType} to check.
 * @returns The {@link PlayerSeat} if the action is valid, otherwise throws.
 * @throws A {@link BlackjackPlayerNotFoundError} if the player is not found.
 * @throws A {@link BlackjackInvalidHandError} if the hand index is invalid.
 * @throws A {@link BlackjackInvalidActionError} if the action is invalid for the player hand.
 */
export function validatePlayerHandAction(
  game: GameState,
  playerId: string,
  handIndex: number,
  action: HandActionType,
): PlayerSeat {
  const gameId = game.id
  const player = game.players
    .filter(isPlayerSeat)
    .find(player => player.playerId === playerId)

  // Is the player in the game?
  if (!player) {
    throw BlackjackError.logAndReturn(
      new BlackjackPlayerNotFoundError(gameId, logScope, playerId),
    )
  }

  /**
   * Do they have a hand at that index?
   * If they don't, this method will throw.
   */
  getPlayerHandByIndex(game, playerId, handIndex)

  // Is this the active hand for play?
  const { activePlayerId, activeHandIndex } =
    getActivePlayerIdAndHandIndex(game)
  if (activePlayerId !== playerId || activeHandIndex !== handIndex) {
    throw BlackjackError.logAndReturn(
      new BlackjackWrongPlayerHandError(
        gameId,
        logScope,
        playerId,
        activePlayerId,
        handIndex,
        activeHandIndex,
      ),
    )
  }

  // Is the action allowed for this player hand?
  if (!canPlayHandAction(action, player, handIndex)) {
    throw BlackjackError.logAndReturn(
      new BlackjackInvalidActionError(
        gameId,
        logScope,
        playerId,
        handIndex,
        action,
      ),
    )
  }
  return player
}

/**
 * Inserts a {@link T item} into a copy of {@link array} and returns the mutated array.
 * @param array The origin array to clone and insert into.
 * @param item The item to insert.
 * @param index The index to insert the item at.
 * @returns The mutated array.
 */
export function insertItemAt<T>(array: T[], item: T, index: number): T[] {
  const newArray = Array.from(array)
  newArray.splice(index, 0, item)
  return newArray
}

/**
 * Sorts a list of {@link UserHandMainWagerRequest wagers} by their index.
 * @param a A {@link UserHandMainWagerRequest wager} to consider.
 * @param b A {@link UserHandMainWagerRequest wager} to consider.
 * @returns A number indicating the sort order.
 */
export function sortWagersByIndex(
  a: UserHandMainWagerRequest,
  b: UserHandMainWagerRequest,
): number {
  const aIndex = a.handIndex ?? 0
  const bIndex = b.handIndex ?? 0
  return aIndex - bIndex
}

/**
 * Sorts a list of {@link PlayerHand hands} by their {@link PlayerHand.handIndex index}.
 * @param a A {@link PlayerHand hand} to consider.
 * @param b A {@link PlayerHand hand} to consider.
 * @returns A number indicating the sort order.
 */
export function sortHandsByIndex(a: PlayerHand, b: PlayerHand): number {
  return a.handIndex - b.handIndex
}

/**
 * Gets a {@link PlayerHand player hand} by their ID and hand index or throws if the hand is not found.
 * @param source The {@link GameState game} or {@link PlayerSeat player} from which to get the hand.
 * @param playerId The ID of the player to get the hand for.
 * @param handIndex The index of the hand to get.
 * @returns The {@link PlayerHand player hand} if found.
 * @throws A {@link BlackjackInvalidHandError} if the hand is not found.
 */
export function getPlayerHandByIndex(
  source: GameState | PlayerSeat,
  playerId: string,
  handIndex: number,
): { hand: PlayerHand; realIndex: number } {
  const sourceIsPayer = isPlayerSeat(source)
  const player = sourceIsPayer ? source : getPlayerByIdOrThrow(source, playerId)
  const gameId = sourceIsPayer ? 'N/A' : source.id
  const hand = player.hands
    .filter(isPlayerHand)
    .find(hand => hand.handIndex === handIndex)
  if (!hand) {
    throw BlackjackError.logAndReturn(
      new BlackjackInvalidHandError(gameId, logScope, playerId, handIndex),
    )
  }
  const realIndex = player.hands.findIndex(hnd => hnd === hand)
  return { hand, realIndex }
}

/**
 * Gets a player by their ID or throws if they are not found.
 * @param game The game from which to get the player.
 * @param playerId The ID of the player to get.
 * @returns A {@link PlayerSeat} if the player is found.
 * @throws A {@link BlackjackPlayerNotFoundError} if the player is not found.
 */
export function getPlayerByIdOrThrow(
  game: GameState,
  playerId: string,
): PlayerSeat {
  const gameId = game.id
  const player = game.players
    .filter(isPlayerSeat)
    .find(player => player.playerId === playerId)
  if (!player) {
    throw BlackjackError.logAndReturn(
      new BlackjackPlayerNotFoundError(gameId, logScope, playerId),
    )
  }
  return player
}

/**
 * Determine the wager group from the amount.
 * @param type The {@link HandWagerType} to check.
 * @param wager The wager amount to check.
 * @returns The wager group (oneOf: `demo`, `dead`, `live`).
 */
export function wagerGroup(
  wager: UserHandWager | UserHandMainWagerRequest,
): BlackjackWagerGroup {
  const { amount, type } = wager
  if (type === HandWagerType.Insurance) {
    return 'live'
  }

  const { amount: config } = WagerConfig[type]
  const mainGroup =
    amount === config.demo
      ? 'demo'
      : amount < config.min || amount > config.max
        ? 'dead'
        : 'live'
  const subGroups = isUserHandMainWagerWithSides(wager)
    ? wager.sides.map(side => wagerGroup(side))
    : []
  const consistent = subGroups.every(group => group === mainGroup)
  return consistent ? mainGroup : 'dead'
}

/**
 * Gets a single wager group from a list of {@link UserSeatRequest}s or throws if there are multiple groups found.
 * @param gameId The game's ID.
 * @param requests The list of {@link UserSeatRequest}s to check.
 * @returns The wager group and the list of wagers.
 * @throws A {@link BlackjackValidationError} if the wagers are invalid, or if there are multiple wager groups.
 */
export function validateWagers(
  gameId: string,
  requests: UserSeatRequest[],
): [Omit<BlackjackWagerGroup, 'dead'>, UserSeatRequest[]] {
  const groupedWagers = requests.reduce<Record<BlackjackWagerGroup, number[]>>(
    (pre, cur) => {
      const curWagers = cur.wagers
        .map(wager => ({ group: wagerGroup(wager), wager }))
        .reduce<Record<BlackjackWagerGroup, number[]>>(
          (pre, cur) => {
            return {
              ...pre,
              [cur.group]: pre[cur.group].concat(cur.wager.amount),
            }
          },
          { demo: [], dead: [], live: [] },
        )
      return {
        demo: pre.demo.concat(curWagers.demo),
        dead: pre.dead.concat(curWagers.dead),
        live: pre.live.concat(curWagers.live),
      }
    },
    { demo: [], dead: [], live: [] },
  )

  const hasMultipleGroups =
    Object.values(groupedWagers).filter(group => group.length > 0).length > 1
  if (groupedWagers.dead.length > 0 || hasMultipleGroups) {
    throw BlackjackError.logAndReturn(
      new BlackjackInvalidWagersError(gameId, logScope),
    )
  }

  const usableWagers = Object.entries(groupedWagers).find(
    ([_group, wagers]) => wagers.length > 0,
  )
  if (!usableWagers) {
    throw BlackjackError.logAndReturn(
      new BlackjackNoUsableWagerError(gameId, logScope),
    )
  }

  return [usableWagers[0] as BlackjackWagerGroup, requests]
}
