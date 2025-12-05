import { config } from 'src/system'
import { type VerifyData } from 'src/modules/game/types'
import { APIValidationError } from 'src/util/errors'

import { getHotboxGameById } from '../documents/hotbox_history'
import { hotboxPointFromHash } from './helpers/hash'

export async function hotboxVerify(data: VerifyData<'hotbox'>) {
  const { gameName } = data

  const game = await getHotboxGameById(data.bet.gameId)

  if (!game) {
    throw new APIValidationError('crash__game_in_progress')
  }

  const gameResult = hotboxPointFromHash(game.hash)

  return {
    serverSeed: game.hash,
    hashedServerSeed: null,
    nonce: null,
    clientSeed: config[gameName].salt,
    result: gameResult,
  }
}
