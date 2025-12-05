import { config } from 'src/system'

import { getAllSlots } from './api'
import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdaterGame,
} from 'src/modules/tp-games/lib'
import { type TPGameDevices } from 'src/modules/tp-games/documents/games'
import { isValidSlotegratorSlotsProviderInternal } from './providers'

const getIdentifierForGameId = (name: string) => `slotegrator:${name}`

/** Temporary for my sanity while migrating overrides. */
const humanReadableProvider = (provider: string) => {
  const providerToProvider = new Map(
    Object.entries({
      EurasianGamingSlots: 'Eurasian Gaming Slots',
      EurasianGamingBingo: 'Eurasian Gaming Bingo',
      PGSoft: 'PG Soft',
    }),
  )
  return providerToProvider.get(provider) ?? provider
}

export const updateSlotegratorSlotsGameList: GameUpdater = async () => {
  const sourceGames = await getAllSlots()

  const games = sourceGames.reduce<GameUpdaterGames>((games, game) => {
    const identifier = getIdentifierForGameId(game.uuid)

    // We are not supporting lobby games for the time being. These require additional frontend
    // and API work. See the integration's documentation for more details.
    if (game.has_lobby) {
      return games
    }

    const providerInternal = game.provider.toLowerCase()

    // We cannot support a provider unless it's in this list, and all
    // related dictionaries have been updated.
    if (!isValidSlotegratorSlotsProviderInternal(providerInternal)) {
      return games
    }

    const devices: TPGameDevices = (() => {
      /**
       * Logic shared by Slotegrator's tech contact:
       *
       * Some providers will have separate game IDs for mobile and desktop versions
       * 1. If in the game there is a "Mobile" word - the game is only for mobile devices
       * 2. If there is no such "Mobile" word in the name and the is_mobile = 0 - the game is only for desktop
       * 3. If there is no "Mobile" word and is_mobile = 1 - the game is for all devices (mobile + desktop)
       */

      if (game.name.includes('Mobile')) {
        return ['mobile']
      }

      if (game.is_mobile === 0) {
        return ['desktop']
      }

      return ['desktop', 'mobile']
    })()

    const updaterGame: GameUpdaterGame = {
      gid: game.uuid,
      title: game.name,
      devices,
      hasFreespins: game.has_freespins === 1,
      aggregator: 'slotegrator',
      provider: humanReadableProvider(game.provider),
      providerInternal,
      squareImage: game.image,
      category: 'slots',
      blacklist: Object.keys(config.countryBlocks.list),
      hasFunMode: true,
      live: false,
    }

    return {
      ...games,
      [identifier]: updaterGame,
    }
  }, {})

  return {
    games,
    recalls: [],
  }
}
