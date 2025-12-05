import { BLACKJACK_GAME_NAME } from 'src/modules/blackjack'
import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdaterGame,
} from 'src/modules/tp-games/lib'

type GameDefaults = Omit<GameUpdaterGame, 'gid' | 'iframeSubdomain' | 'title'>

// This number was picked based on the max, manually set popularity in production.
const HouseGamePopularity = 1000000000000000

const gameDefaults: GameDefaults = {
  devices: ['desktop', 'mobile'],
  hasFreespins: false,
  aggregator: 'roobet',
  provider: 'Roobet',
  category: 'house',
  blacklist: [],
  live: false,
  providerInternal: 'roobet',
  payout: 98,
  squareImage: '',
  hasFunMode: true,
}

const luckyPengwinDefault: GameDefaults = {
  devices: ['desktop', 'mobile'],
  hasFreespins: false,
  aggregator: 'roobet',
  provider: 'Lucky Pengwin',
  category: 'casual',
  blacklist: [],
  live: false,
  providerInternal: 'lucky pengwin',
  payout: 98,
  squareImage: '',
  hasFunMode: true,
}

export const uniqueGames: GameUpdaterGame[] = [
  {
    ...luckyPengwinDefault,
    gid: 'yetiCashDash',
    iframeSubdomain: 'yeti-towers.games',
    title: 'Yeti Cash Dash',
    payout: 96,
  },
]

export const houseGames: GameUpdaterGame[] = [
  {
    ...gameDefaults,
    gid: 'Plinko',
    iframeSubdomain: 'plinko.games',
    title: 'Plinko',
    payout: 99,
  },
  {
    ...gameDefaults,
    gid: 'hotbox',
    iframeSubdomain: 'hotbox.games',
    title: "Snoop's HotBox",
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: 'roulette',
    iframeSubdomain: 'roulette.games',
    title: 'Roulette',
    payout: 95,
  },
  {
    ...gameDefaults,
    gid: 'towers',
    iframeSubdomain: 'towers.games',
    title: 'Towers',
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: 'dice',
    iframeSubdomain: 'dice.games',
    title: 'Dice',
    payout: 99,
  },
  {
    ...gameDefaults,
    gid: 'coinflip',
    iframeSubdomain: 'coinflip.games',
    title: 'Coinflip',
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: 'mines',
    iframeSubdomain: 'mines.games',
    title: 'Mines',
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: 'crash',
    title: 'Crash',
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: 'linearmines',
    title: 'Mission Uncrossable',
    payout: 96,
  },
  {
    ...gameDefaults,
    gid: BLACKJACK_GAME_NAME,
    title: 'Blackjack',
  },
  ...uniqueGames,
]

export const updateHouseGameList: GameUpdater = () => {
  const games = houseGames.reduce<GameUpdaterGames>((games, houseGame) => {
    const identifier =
      houseGame.provider === 'lucky pengwin'
        ? `luckypengwin:${houseGame.gid}`
        : `housegames:${houseGame.gid}`

    return {
      ...games,
      [identifier]: {
        gid: houseGame.gid,
        title: houseGame.title,
        devices: houseGame.devices,
        hasFreespins: houseGame.hasFreespins,
        aggregator: houseGame.aggregator,
        provider: houseGame.provider,
        providerInternal: houseGame.providerInternal,
        category: houseGame.category,
        blacklist: houseGame.blacklist,
        hasFunMode: houseGame.hasFunMode,
        live: houseGame.live,
        payout: houseGame.payout,
        iframeSubdomain: houseGame.iframeSubdomain,
        popularity: HouseGamePopularity,
      },
    }
  }, {})

  return {
    games,
    recalls: [],
  }
}
