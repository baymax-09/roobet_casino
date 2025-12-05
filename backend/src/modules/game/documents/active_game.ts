import { APIValidationError } from 'src/util/errors'

import { type ActiveGame } from '../types'
import { type RTable } from 'rethinkdbdash'

export function trimForFrontend(
  activeGame: ActiveGame,
  extraParams: Record<string, any>,
): ActiveGame {
  const trimmedGame = {
    id: activeGame.id,
    userId: activeGame.userId,
    ...extraParams,
  }

  return trimmedGame
}

export async function getActiveGameById<T extends ActiveGame>(
  activeGameTable: RTable<T, any>,
  activeGameId: string,
): Promise<T | null> {
  return await activeGameTable.get(activeGameId).run()
}

export async function getActiveGameByUser<T extends ActiveGame>(
  activeGameTable: RTable<T, any>,
  userId: string,
): Promise<T> {
  const [activeGame] = await activeGameTable
    .getAll(userId, { index: 'userId' })
    .run()
  return activeGame
}

/** Ensures that each user only has one active game at a time per game. */
export async function clearUserActiveGames<T extends ActiveGame>(
  activeGameTable: RTable<T, any>,
  userId: string,
): Promise<void> {
  await activeGameTable.getAll(userId, { index: 'userId' }).delete().run()
}

export async function clearActiveGame<T extends ActiveGame>(
  activeGameTable: RTable<T, any>,
  activeGameId: string,
): Promise<void> {
  await activeGameTable.get(activeGameId).delete().run()
}

export async function createActiveGame<T extends ActiveGame>(
  activeGameTable: any,
  userId: string,
  orderedDeck: any,
  extraParams: any,
): Promise<string> {
  const toInsert: T = {
    userId,
    played: {},
    deck: orderedDeck,
    ...extraParams,
  }

  const activeGame = await activeGameTable.insert(toInsert).run()
  return activeGame.generated_keys[0]
}

/**
 * Marks a card as "played" (revealed or flipped over) in a deck.
 */
export async function markCardAsPlayed<T extends ActiveGame>(
  activeGameTable: any,
  activeGameId: string,
  card: number,
  cardType: any, // This is different for Mines and Towers
): Promise<T | null> {
  const results = await activeGameTable
    .get(activeGameId)
    .update({ played: { [card]: cardType } }, { returnChanges: true })
    .run()
  if (results.unchanged) {
    throw new APIValidationError('game__tile_already_played')
  }
  return results && results.changes && results.changes[0]
    ? results.changes[0].new_val
    : null
}

export async function updateActiveGame(
  activeGameTable: any,
  activeGameId: string,
  toUpdate: any,
): Promise<void> {
  await activeGameTable.get(activeGameId).update(toUpdate).run()
}
