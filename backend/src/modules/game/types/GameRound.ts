import { type Types, Schema } from 'mongoose'

export interface GameRound {
  _id: Types.ObjectId
  userId: string
  roundOver: boolean
  gameName: string
  id?: string
  hash: string
  seed?: string
  nonce: number
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 30 days
const GAME_ROUND_TTL_SECONDS = 60 * 60 * 24 * 30

export const getGameRoundSchema = <T extends GameRound>(gameName: string) => {
  return new Schema<T>(
    {
      gameName: { type: String, required: true, enum: [gameName] },
      hash: { type: String, required: true },
      seed: String,
      nonce: { type: Number, required: true, default: 0 },
      roundOver: { type: Boolean, required: true, default: false },
      userId: { type: String, index: true },
      completedAt: {
        type: Date,
        index: true,
        expires: GAME_ROUND_TTL_SECONDS,
      },
    },
    {
      timestamps: true,
    },
  )
}
