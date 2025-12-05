import { config } from 'src/system'

import { getAllSportsbookGames } from './api'
import {
  type GameUpdaterGame,
  type GameUpdater,
  type GameUpdaterGames,
} from 'src/modules/tp-games/lib'

const getIdentifierForGameId = (name: string) => `slotegrator:${name}`

export const updateSlotegratorSportsGameList: GameUpdater = async () => {
  const sourceGames = await getAllSportsbookGames()

  const games = sourceGames.reduce<GameUpdaterGames>((games, game) => {
    const identifier = getIdentifierForGameId(game.externalId)

    const updaterGame: GameUpdaterGame = {
      gid: game.uuid,
      title: game.name,
      devices: ['desktop', 'mobile'],
      hasFreespins: false,
      aggregator: 'slotegrator',
      provider: 'Betby',
      providerInternal: 'betby',
      category: 'sportsbetting',
      blacklist: Object.keys(config.countryBlocks.list),
      hasFunMode: false,
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
