import { r } from 'src/system'
import { type Types as GameTypes } from 'src/modules/game'
import { type DBCollectionSchema } from 'src/modules'

export const JungleMinesIndexes = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
] as const
export type JungleMinesIndex = (typeof JungleMinesIndexes)[number]
export function isJungleMinesIndex(index: any): index is JungleMinesIndex {
  return JungleMinesIndexes.includes(index)
}

export const JungleMinesCards = ['diamond', 'mine'] as const
export type JungleMinesCard = (typeof JungleMinesCards)[number]
export function isJungleMinesCard(card: any): card is JungleMinesCard {
  return JungleMinesCards.includes(card)
}

export type JungleMinesDeck = Record<JungleMinesIndex, JungleMinesCard>
export type PlayedJungleMinesCards = Partial<JungleMinesDeck>

export interface ActiveJungleMinesGame extends GameTypes.ActiveGame {
  deck: JungleMinesDeck
  played: PlayedJungleMinesCards
  minesCount: number
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const ActiveJungleMinesGames = r.table<ActiveJungleMinesGame>(
  'active_jungle_mines_games',
)

export async function getActiveJungleMinesGameByUserId(userId: string) {
  const [activeGame] = await ActiveJungleMinesGames.getAll(userId, {
    index: 'userId',
  }).run()
  return activeGame
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'active_jungle_mines_games',
  indices: [{ name: 'userId' }],
}
