import { config } from 'src/system'
import { type VerifyData } from 'src/modules/game/types'
import { APIValidationError } from 'src/util/errors'

import { getCrashGameById } from '../documents/crash_history_mongo'
import { crashPointFromHash } from './helpers/hash'

export async function crashVerify(data: VerifyData<'crash'>) {
  const { gameName } = data

  const game = await getCrashGameById(data.bet.gameId)

  if (!game) {
    throw new APIValidationError('crash__game_in_progress')
  }

  const gameResult = crashPointFromHash(game.hash)

  return {
    serverSeed: game.hash,
    hashedServerSeed: null,
    nonce: null,
    clientSeed: config[gameName].salt,
    result: gameResult,
  }
}
