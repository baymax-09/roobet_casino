import moment from 'moment'

import { APIValidationError } from 'src/util/errors'
import {
  unfinishedPNGGames,
  type PNGGameRound,
} from 'src/vendors/game-providers/playngo/documents/game-rounds'
import {
  unfinishedSoftswissGames,
  type SFGame,
} from 'src/vendors/game-providers/softswiss/documents/games'
import {
  unfinishedPragmaticGames,
  type PragmaticGameRound,
} from 'src/vendors/game-providers/pragmatic/documents/game-rounds'
import { unfinishedHacksawGames } from 'src/vendors/game-providers/hacksaw'

import { getActiveBetsForUser } from '../documents/active_bet'
import { findGamesByQuery } from 'src/modules/tp-games/documents/games'
import { type ActiveBet } from '../documents/activeBetsMongo'
import { unfinishedSlotegratorRounds } from 'src/vendors/game-providers/slotegrator/sports/documents/slotegratorActions'

// any other bet provider integration must add to this  list
export async function checkUserHasOpenBets(
  userId: string,
  sinceTimestamp: string,
): Promise<false> {
  const gamesOrigin: string[] = []
  const bets = await getActiveBetsForUser(userId)
  const activeBets = bets
    .filter(({ timestamp }) => {
      // only count bets since the timestamp
      return moment(timestamp) > moment(sinceTimestamp)
    })
    .filter(({ closedOut }) => !closedOut)

  if (activeBets.length) {
    gamesOrigin.push(activeBets[0].gameName)
  }

  const providers = [
    { name: 'hacksaw', fetch: unfinishedHacksawGames },
    { name: 'playngo', fetch: unfinishedPNGGames },
    { name: 'softswiss', fetch: unfinishedSoftswissGames },
    { name: 'pragmatic', fetch: unfinishedPragmaticGames },
    { name: 'slotegrator', fetch: unfinishedSlotegratorRounds },
  ] satisfies Array<{
    name: string
    fetch: (params: {
      userId: string
      sinceTimestamp: string
    }) => Promise<Array<Record<string, any>>>
  }>

  const gameQueries: any[] = []
  for (const provider of providers) {
    const unfinishedGames = await provider.fetch({ userId, sinceTimestamp })

    if (unfinishedGames && unfinishedGames.length > 0) {
      if (provider.name === 'hacksaw') {
        for (const game of unfinishedGames as ActiveBet[]) {
          gameQueries.push({
            identifier: game.gameIdentifier,
            aggregator: provider.name,
          })
        }
      }
      if (provider.name === 'slotegrator') {
        for (const game of unfinishedGames as ActiveBet[]) {
          gameQueries.push({
            identifier: game.gameIdentifier,
          })
        }
      }
      if (provider.name === 'pragmatic') {
        for (const game of unfinishedGames as PragmaticGameRound[]) {
          gameQueries.push({ gid: game.gameId, provider: provider.name })
        }
      }

      if (provider.name === 'softswiss') {
        for (const game of unfinishedGames as SFGame[]) {
          gameQueries.push({
            identifier: game.game,
            aggregator: provider.name,
          })
        }
      }

      if (provider.name === 'playngo') {
        for (const game of unfinishedGames as PNGGameRound[]) {
          gameQueries.push({
            gidNumericDesktop: game?.gameId,
            aggregator: provider.name,
          })
          gameQueries.push({
            gidNumericMobile: game.gameId,
            aggregator: provider.name,
          })
        }
      }
    }
  }

  if (gameQueries.length > 0) {
    const activeGames = await findGamesByQuery(gameQueries)
    const gameTitles = activeGames?.map(game => game.title) || []
    gamesOrigin.push(...gameTitles)
  }

  if (gamesOrigin.length > 0) {
    const gamesList = gamesOrigin.join(', ')
    throw new APIValidationError('promo__cannot_close', [gamesList])
  }

  return false
}
