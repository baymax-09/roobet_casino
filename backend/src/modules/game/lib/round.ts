import { config } from 'src/system'
import { Documents as DiceDocuments } from 'src/modules/dice'
import { Documents as MinesDocuments } from 'src/modules/mines'
import { Documents as PlinkoDocuments } from 'src/modules/plinko'
import { Documents as HiloDocuments } from 'src/modules/hilo'
import { Documents as LinearMinesDocuments } from 'src/modules/linearmines'
import { Documents as CoinFlipDocuments } from 'src/modules/coinflip'
import { Documents as CashDashDocuments } from 'src/modules/cash-dash'
import { Documents as JungleMinesDocuments } from 'src/modules/junglemines'
import { Documents as BlackjackDocuments } from 'src/modules/blackjack'
import * as Towers from 'src/modules/towers/index'
import { type Types as UserTypes } from 'src/modules/user'
import {
  type GameRoundHash,
  incrementRoundNonce,
  startGameHashRound,
  generateRoundHash,
} from 'src/modules/game/lib/provably_fair/userGenerated'
import { saltWithClientSeed } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import {
  type GameRound,
  type HouseGamesWithRoundTable,
} from 'src/modules/game/types'

const getRoundTables = () => ({
  dice: DiceDocuments.DiceRound.DiceRoundModel,
  hilo: HiloDocuments.HiloRound.HiloRoundModel,
  plinko: PlinkoDocuments.PlinkoRound.PlinkoRoundModel,
  mines: MinesDocuments.MinesRound.MinesRoundModel,
  towers: Towers.Documents.TowersRounds.TowersRoundModel,
  linearmines: LinearMinesDocuments.LinearMinesRound.LinearMinesRoundModel,
  coinflip: CoinFlipDocuments.CoinFlipRound.CoinFlipRoundModel,
  cashdash: CashDashDocuments.CashDashRounds.CashDashRoundModel,
  junglemines: JungleMinesDocuments.JungleMinesRound.JungleMinesRoundModel,
  blackjack: BlackjackDocuments.BlackjackRounds.BlackjackRoundModel,
})

export function getRoundTableForGame(gameName: HouseGamesWithRoundTable) {
  return getRoundTables()[gameName]
}

/*
 * For any game that deals with rounds,
 * returns the hash used to calculate the game results (NEVER RETURN OUTSIDE THIS FUNCTION)
 * and returns the remaining Provably Fair info, which can be shared with the frontend.
 */
export async function startNewRound(
  user: UserTypes.User,
  gameName: HouseGamesWithRoundTable,
  clientSeedArg?: string,
) {
  const clientSeed = clientSeedArg || config[gameName].defaultClientSeed
  const gameRoundTable = getRoundTableForGame(gameName)

  const buildRoundResponse = (
    currentRound: GameRound,
    roundStartInfo: GameRoundHash | null,
    newRound: boolean,
  ) => {
    const { secretHash: roundHash } = generateRoundHash(
      gameName,
      currentRound._id.toString(),
    )
    const noncedSeed = `${clientSeed} - ${currentRound.nonce}`
    const hash = saltWithClientSeed(roundHash, noncedSeed)
    const provablyFairInfo = { newRound, roundStartInfo, currentRound }
    return { hash, provablyFairInfo: { ...provablyFairInfo, clientSeed } }
  }

  // increment nonce for round, if it exists
  const updatedRound = await incrementRoundNonce(
    user.id,
    gameName,
    gameRoundTable,
  )

  // if there's no round to update, then we create one
  if (!updatedRound) {
    const { newRound, hash, previousRoundSeed } = await startGameHashRound(
      user,
      gameName,
      gameRoundTable,
    )
    const roundStartInfo = { hash, previousRoundSeed }
    return buildRoundResponse(newRound, roundStartInfo, true)
  }

  return buildRoundResponse(updatedRound, null, false)
}
