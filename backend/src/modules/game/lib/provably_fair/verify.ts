import { APIValidationError } from 'src/util/errors'
import { getBetByBetId } from 'src/modules/bet'
import { type Types as UserTypes } from 'src/modules/user'

import { rouletteVerify } from 'src/modules/roulette/lib/verify'
import { crashVerify } from 'src/modules/crash/lib/verify'
import { hotboxVerify } from 'src/modules/hotbox/lib/verify'
import { diceVerify } from 'src/modules/dice/lib/verify'
import { plinkoVerify } from 'src/modules/plinko/lib/verify'
import { minesVerify } from 'src/modules/mines/lib/verify'
import { linearMinesVerify } from 'src/modules/linearmines/lib/verify'
import { towersVerify } from 'src/modules/towers/lib/verify'
import { verifyCoinFlip } from 'src/modules/coinflip/lib/verify'
import { cashDashVerify } from 'src/modules/cash-dash/lib/verify'
import { jungleMinesVerify } from 'src/modules/junglemines/lib/verify'

import {
  isVerificationError,
  type VerificationLookup,
  type VerifyData,
  type HouseGamesWithVerification,
} from '../../types'
import { verifyBlackjack } from 'src/modules/blackjack/lib/verify'

const verificationLookup: VerificationLookup = {
  roulette: rouletteVerify,
  crash: crashVerify,
  dice: diceVerify,
  plinko: plinkoVerify,
  mines: minesVerify,
  towers: towersVerify,
  linearmines: linearMinesVerify,
  hotbox: hotboxVerify,
  coinflip: verifyCoinFlip,
  cashdash: cashDashVerify,
  junglemines: jungleMinesVerify,
  blackjack: verifyBlackjack,
  // @todo: Implement this once the game API is in use.
  hilo: async () => ({
    code: 0,
    message: 'Game not found.',
  }),
}

export async function startVerification(
  user: UserTypes.User,
  gameName: HouseGamesWithVerification,
  betId: string,
) {
  const bet = await getBetByBetId(betId)

  if (!bet) {
    throw new APIValidationError('bet__not_closed')
  }

  if (bet.gameName !== gameName) {
    throw new APIValidationError('game__bet_no_match')
  }

  if (bet.userId !== user.id) {
    throw new APIValidationError('bet__not_match_user')
  }

  const verifyData: VerifyData<typeof gameName> = {
    user,
    gameName,
    betId: bet.betId,
    bet,
  }

  // @ts-expect-error not sure why this is wrong
  const gameResult = await verificationLookup[gameName](verifyData)
  if (isVerificationError(gameResult)) {
    throw new APIValidationError(gameResult.message)
  }
  return gameResult
}
