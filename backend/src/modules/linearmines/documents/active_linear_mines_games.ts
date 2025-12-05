import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export const LinearMinesCards = ['diamond', 'mine'] as const
export type LinearMinesCard = (typeof LinearMinesCards)[number]
export function isLinearMinesCard(index: any): index is LinearMinesCard {
  return LinearMinesCards.includes(index as LinearMinesCard)
}

export type LinearMinesDeck = Record<number, LinearMinesCard>
export type PlayedMinesCards = Partial<LinearMinesDeck>

export interface BaseActiveLinearMinesGame {
  userId: string
  bet?: string
  maxBet?: number
  deck: LinearMinesDeck
  played: PlayedMinesCards
  minesCount: number
}

export interface ActiveLinearMinesGame extends BaseActiveLinearMinesGame {
  _id: Types.ObjectId
  id: string
  createdAt: Date
  updatedAt: Date
}

const LinearMinesActiveGamesSchema = new mongoose.Schema<ActiveLinearMinesGame>(
  {
    deck: Map,
    minesCount: Number,
    played: Map,
    bet: String,
    // @ts-expect-error string vs date
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
    userId: { type: String, index: true },
  },
  { timestamps: true },
)

const LinearMinesActiveGamesModel = mongoose.model<ActiveLinearMinesGame>(
  'linear_mines_active_games',
  LinearMinesActiveGamesSchema,
)

export async function insertLinearMinesActiveGame(
  game: BaseActiveLinearMinesGame,
): Promise<ActiveLinearMinesGame> {
  return await LinearMinesActiveGamesModel.create(game)
}

export async function getLinearMinesActiveGamesForUser({
  userId,
  limit = 10,
}: {
  userId: string
  limit?: number
}): Promise<ActiveLinearMinesGame[]> {
  return await LinearMinesActiveGamesModel.find({ userId }).limit(limit).lean()
}

export async function clearUserActiveGames(userId: string) {
  await LinearMinesActiveGamesModel.deleteMany({ userId })
}

export async function markCardAsPlayed(
  activeGame: ActiveLinearMinesGame,
  selectedCard: number,
  cardType: LinearMinesCard,
): Promise<ActiveLinearMinesGame> {
  if (!activeGame) {
    throw new Error('No active game')
  }

  activeGame.played[selectedCard] = cardType

  return await LinearMinesActiveGamesModel.findOneAndUpdate(
    { _id: activeGame._id },
    { played: activeGame.played },
    { new: true, upsert: true },
  ).lean()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: LinearMinesActiveGamesModel.collection.name,
}
