import { r } from 'src/system'
import { type Types as GameTypes } from 'src/modules/game'
import { type DBCollectionSchema } from 'src/modules'

export const Mines25Indexes = [
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

export const Mines36Indexes = [
  ...Mines25Indexes,
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
] as const

export const Mines49Indexes = [
  ...Mines36Indexes,
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
] as const

export const Mines64Indexes = [
  ...Mines49Indexes,
  '49',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59',
  '60',
  '61',
  '62',
  '63',
] as const
export type MinesIndex =
  | (typeof Mines25Indexes)[number]
  | (typeof Mines36Indexes)[number]
  | (typeof Mines49Indexes)[number]
  | (typeof Mines64Indexes)[number]

export const currentMinesIndex = (gridSize: number) => {
  switch (gridSize) {
    case 25:
      return Mines25Indexes
    case 36:
      return Mines36Indexes
    case 49:
      return Mines49Indexes
    case 64:
      return Mines64Indexes
    default:
      return Mines25Indexes
  }
}

export const gridSizes = [25, 36, 49, 64] as const

export function isMinesIndex(
  index: any,
  gridSize: number,
): index is MinesIndex {
  switch (gridSize) {
    case 25:
      return Mines25Indexes.includes(index)
    case 36:
      return Mines36Indexes.includes(index)
    case 49:
      return Mines49Indexes.includes(index)
    case 64:
      return Mines64Indexes.includes(index)
  }
  return false
}

export const MinesCards = ['diamond', 'mine'] as const
export type MinesCard = (typeof MinesCards)[number]
export function isMinesCard(card: any): card is MinesCard {
  return MinesCards.includes(card)
}

export type MinesDeck = Record<MinesIndex, MinesCard>
export type PlayedMinesCards = Partial<MinesDeck>

export interface ActiveMinesGame extends GameTypes.ActiveGame {
  deck: MinesDeck
  played: PlayedMinesCards
  minesCount: number
  gridCount: number
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const ActiveMinesGames = r.table<ActiveMinesGame>('active_mines_games')

export async function getActiveMinesGameByUserId(userId: string) {
  const [activeGame] = await ActiveMinesGames.getAll(userId, {
    index: 'userId',
  }).run()
  return activeGame
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'active_mines_games',
  indices: [{ name: 'userId' }],
}
