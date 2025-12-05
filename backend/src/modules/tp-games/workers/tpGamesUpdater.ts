import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { updateHub88GameList } from 'src/vendors/game-providers/hub88'
import { updatePragmaticGameList } from 'src/vendors/game-providers/pragmatic'
import { updatePlayngoGameList } from 'src/vendors/game-providers/playngo'
import { updateSoftswissGameList } from 'src/vendors/game-providers/softswiss'
import { updateSlotegratorSportsGameList } from 'src/vendors/game-providers/slotegrator/sports'
import { updateSlotegratorSlotsGameList } from 'src/vendors/game-providers/slotegrator/slots'
import {
  updateYggdrasilGamesList,
  YGGDRASIL_PROVIDER_NAME,
} from 'src/vendors/game-providers/yggdrasil'
import { updateHacksawGameList } from 'src/vendors/game-providers/hacksaw'
import { updateHouseGameList } from 'src/modules/game'
import { scopedLogger } from 'src/system/logger'

import { type GameUpdaters } from '../lib'
import {
  type TPGameOriginals,
  deleteGames,
  updateGame,
} from '../documents/games'

const tpGamesUpdaterLogger = scopedLogger('tpGamesUpdater')

const GAME_UPDATERS: GameUpdaters = {
  roobet: updateHouseGameList,
  pragmatic: updatePragmaticGameList,
  playngo: updatePlayngoGameList,
  hub88: updateHub88GameList,
  softswiss: updateSoftswissGameList,
  hacksaw: updateHacksawGameList,
  slotegratorSports: updateSlotegratorSportsGameList,
  slotegratorSlots: updateSlotegratorSlotsGameList,
  [YGGDRASIL_PROVIDER_NAME]: updateYggdrasilGamesList,
}

export async function startJob(): Promise<void> {
  const logger = tpGamesUpdaterLogger('startJob', { userId: null })

  // New handling.
  for (const [integration, fetchConfig] of Object.entries(GAME_UPDATERS)) {
    logger.info(`[gameUpdater] ${integration}: Fetching config.`)

    try {
      const { games, recalls } = await fetchConfig()

      // Upsert game records.
      logger.info(
        `[gameUpdater] ${integration}: Updating ${
          Object.keys(games).length
        } games.`,
        { integration },
      )

      for (const [identifier, game] of Object.entries(games)) {
        logger.info('[gameUpdater] updating', { integration, game })
        if (game.payout && game.payout < 1) {
          // There is likely an issue with this game. Do not update.
          logger.error('Detected an RTP less than 1% and rejecting update', {
            integration,
            game,
          })
        } else {
          // Only write these values on insert
          const {
            title,
            provider,
            category,
            squareImage,
            description,
            payout,
            blacklist,
            ...rest
          } = game
          // Setting the provider data in a unmodifiable space
          const originals: Record<TPGameOriginals, any> = {
            identifier,
            title,
            provider,
            category,
            payout,
            description,
            blacklist,
          }

          await updateGame(
            { identifier },
            {
              $set: { ...rest, originals, identifier },
              $setOnInsert: {
                title,
                provider,
                category,
                squareImage,
                description,
                payout,
                blacklist,
              },
            },
          )
        }
      }

      // Delete specified game records.
      logger.info(
        `[gameUpdater] ${integration}: Deleting by ${recalls.length} filters.`,
        { integration },
      )

      for (const filter of recalls) {
        await deleteGames(filter)
      }

      logger.info(`[gameUpdater] ${integration}: Complete.`, { integration })
    } catch (error) {
      logger.error(
        `[gameUpdater] ${integration}: Error updating games.`,
        { integration },
        error,
      )
    }
  }
}

async function start(): Promise<void> {
  while (true) {
    await startJob()
    await sleep(1000 * 60 * 10) // 10 minutes
  }
}

export async function run() {
  if (config.oneshot) {
    await runJob('tpGamesUpdater', startJob)
  } else {
    await runWorker('tpGamesUpdater', start)
  }
}
