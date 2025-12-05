import { type HacksawGame, getAllGames } from './api'
import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdaterGame,
} from 'src/modules/tp-games/lib'
import { type Category } from 'src/modules/bet/types'

const getIdentifierForGameId = (name: string) => `hacksaw:${name}`

function getGameCategory(_: HacksawGame): Category {
  return 'slots'
}

export const updateHacksawGameList: GameUpdater = async () => {
  const sourceGames = await getAllGames()

  const games = sourceGames.reduce<GameUpdaterGames>((games, game) => {
    const category = getGameCategory(game)

    // Skip games with no category.
    if (!category) {
      return games
    }

    const identifier = getIdentifierForGameId(game.gameId.toString())

    const updaterGame: GameUpdaterGame = {
      gid: `${game.gameId}`,
      title: game.gameName,
      devices: ['desktop', 'mobile'],
      hasFreespins: false,
      aggregator: 'hacksaw',
      provider: 'Hacksaw Gaming',
      providerInternal: 'hacksaw gaming',
      category,
      blacklist: [
        'US',
        'IR',
        'KP',
        'SY',
        'CU',
        'SD',
        'AU',
        'ES',
        'CA-ON',
        'GR',
        'UK',
      ],
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
