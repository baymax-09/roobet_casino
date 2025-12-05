import { getIdentifierForGameId } from './games'

import { getGames } from './api'
import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdaterGame,
} from 'src/modules/tp-games/lib'
import { exists } from 'src/util/helpers/types'
import { type TPGameDevices } from 'src/modules/tp-games/documents/games'

function getCategory(category: string) {
  if (category === 'Video Slots') {
    return 'slots'
  }
  if (category === 'Live games') {
    return 'live-games'
  }
  return false
}

export const updatePragmaticGameList: GameUpdater = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGameList: Array<Record<string, any>> = await getGames()

  const games = rawGameList.reduce<GameUpdaterGames>((games, pragmaticGame) => {
    // Validate category.
    const category = getCategory(pragmaticGame.typeDescription)

    if (!category) {
      return games
    }

    // Validate name.
    if (!pragmaticGame.gameName) {
      return games
    }

    const devices: TPGameDevices = (
      [
        pragmaticGame.platform.includes('WEB') ? 'desktop' : null,
        pragmaticGame.platform.includes('MOBILE') ? 'mobile' : null,
      ] as const
    ).filter(exists)

    if (category === 'live-games') {
      pragmaticGame.payout = 99.75
      pragmaticGame.live = true
    }

    if (pragmaticGame.gameID === '103') {
      pragmaticGame.gameName = 'Blackjack Lobby'
      pragmaticGame.payout = 99.5
    }
    if (pragmaticGame.gameID === '104') {
      pragmaticGame.gameName = 'Baccarat Lobby'
      pragmaticGame.payout = 99
    }
    if (pragmaticGame.gameID === '801') {
      pragmaticGame.gameName = 'Mega Wheel'
      pragmaticGame.payout = 97
    }
    if (pragmaticGame.gameID === '204') {
      pragmaticGame.gameName = 'Mega Roulette'
      pragmaticGame.payout = 97
    }
    if (pragmaticGame.gameID === '1101') {
      pragmaticGame.gameName = 'Sweet Bonanza CandyLand'
      pragmaticGame.payout = 97
    }

    const game: GameUpdaterGame = {
      gid: pragmaticGame.gameID,
      title: pragmaticGame.gameName,
      devices,
      // TODO find an example of game without freespins
      hasFreespins: pragmaticGame.frbAvailable,
      aggregator: 'pragmatic',
      provider: 'Pragmatic Play',
      providerInternal: 'pragmatic',
      category,
      blacklist: [
        'AU',
        'BG',
        'BS',
        'CY',
        'DK',
        'ES',
        'FR',
        'GB',
        'GI',
        'IL',
        'IT',
        'KP',
        'LT',
        'PH',
        'PT',
        'RO',
        'RS',
        'SE',
        'TW',
        'UA',
        'US',
        'ZA',
      ],
      hasFunMode: pragmaticGame.demoGameAvailable,
      live: !!pragmaticGame.live,
      // TODO get real payout
      payout: parseFloat((parseFloat(pragmaticGame.payout) || 97.0).toFixed(2)),
      squareImage: `https://tekhou5-dk2.pragmaticplay.net/game_pic/square/200/${pragmaticGame.gameID}.png`,
    }

    const identifier = getIdentifierForGameId(pragmaticGame.gameID)

    return {
      ...games,
      [identifier]: game,
    }
  }, {})

  return {
    games,
    recalls: [],
  }
}
