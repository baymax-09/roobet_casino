import { type Schema, type Model, model } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { type GameRound, getGameRoundSchema } from 'src/modules/game/types'

export class GameRoundDAL<T extends GameRound> {
  RoundSchema: Schema
  RoundModel: Model<T>

  constructor(gameName: string, collectionName: string) {
    this.RoundSchema = getGameRoundSchema<T>(gameName)
    this.RoundModel = model<T>(collectionName, this.RoundSchema)
  }

  async getRoundById(_id: string) {
    return await this.RoundModel.findOne({ _id })
  }

  get schema(): DBCollectionSchema {
    return {
      db: 'mongo',
      name: this.RoundModel.collection.name,
    }
  }
}
