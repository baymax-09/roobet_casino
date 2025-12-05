import moment from 'moment'

import { getIdentifierForGameCode, listGames } from './games'
import { type Hub88Provider } from './types'
import {
  type GameUpdaterGame,
  type GameUpdater,
  type GameUpdaterGames,
} from 'src/modules/tp-games/lib'

const HUB88_ENABLED_PROVIDERS: Record<Hub88Provider, true> = {
  'Booming Games': true,
  Microgaming: true,
  'Blueprint Gaming': true,
  'Caleta Gaming': true,
  'Kalamba Games': true,
  Habanero: true,
  'Green Jade': true,
  'Green Jade Arcade': true,
  MrSlotty: true,
  'Evoplay Entertainment': true,
  Fugaso: true,
  EGT: true,
  BetsyGames: true,
  OneTouch: true,
  'Bombay Live': true,
  'Red Rake Gaming': true,
  Gamomat: true,
  'Golden Rock Studios': true,
  Endorphina: true,
  Octoplay: true,
  Rogue: true,
  Genii: true,
  LadyLuck: true,
  // Begin Games Global
  'Triple Edge': true,
  Stormcraft: true,
  Gameburger: true,
  'SpinPlay Games': true,
  All41: true,
  'Alchemy Gaming': true,
  JFTW: true,
  'Neon Valley': true,
  'Snowborn Studios': true,
  Foxium: true,
  Slingshot: true,
  'Northern Lights Gaming': true,
  'Buck Stakes Entertainment': true,
  'Old Skool': true,
  'Gong Gaming': true,
  // End Games Global
  'MG Slots': true,
  'MG Grand Live': true,
}

/** Temporary for my sanity while migrating overrides. */
const humanReadableProvider = (product: string) => {
  const productToProviderMap = new Map(
    Object.entries({
      JFTW: 'Just For The Win',
      Slingshot: 'Slingshot Studios',
      'Neon Valley': 'Neon Valley Studios',
      LadyLuck: 'Lady Luck',
    }),
  )
  return productToProviderMap.get(product) ?? product
}

export const updateHub88GameList: GameUpdater = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGamesList: Array<Record<string, any>> = await listGames()

  const games = rawGamesList.reduce<GameUpdaterGames>((games, sourceGame) => {
    // Check for enabled provider.
    if (
      !HUB88_ENABLED_PROVIDERS[
        sourceGame.product as keyof typeof HUB88_ENABLED_PROVIDERS
      ]
    ) {
      return games
    }

    // Check for valid release date.
    if (
      sourceGame.release_date &&
      moment(sourceGame.release_date, 'YYYY-MM-DD') > moment()
    ) {
      return games
    }

    // Update category.
    sourceGame.category = sourceGame.category.toLowerCase()

    if (sourceGame.category.includes('roulette')) {
      sourceGame.category = 'roulette'
    } else if (sourceGame.category.includes('slot')) {
      sourceGame.category = 'slots'
    } else if (sourceGame.category.includes('live games')) {
      sourceGame.category = 'sportsbetting'
    } else if (sourceGame.category.includes('scratch cards')) {
      sourceGame.category = 'scratch cards'
    } else if (sourceGame.category.includes('blackjack')) {
      sourceGame.category = 'blackjack'
    } else if (sourceGame.category.includes('baccarat')) {
      sourceGame.category = 'baccarat'
    } else if (sourceGame.category.includes('table')) {
      sourceGame.category = 'table games'
    }

    // Update RTP.
    if (sourceGame.name === 'Sport Betting') {
      sourceGame.rtp = 95
    }

    if (sourceGame.product === 'Microgaming') {
      sourceGame.product = 'Games Global'
    }

    // Update devices list.
    sourceGame.devices = [
      sourceGame.platforms.includes('GPL_DESKTOP') ? 'desktop' : null,
      sourceGame.platforms.includes('GPL_MOBILE') ? 'mobile' : null,
    ].filter(device => device)

    // Update images.
    sourceGame.squareImage = sourceGame.url_thumb
    sourceGame.backgroundImage = sourceGame.url_background

    // Update name.
    sourceGame.name = sourceGame.name.replace('Video Slot', '')

    const identifier = getIdentifierForGameCode(sourceGame.game_code)

    const provider = humanReadableProvider(sourceGame.product)

    const updaterGame: GameUpdaterGame = {
      gid: sourceGame.game_code,
      title: sourceGame.name,
      devices: sourceGame.devices,
      hasFreespins: sourceGame.freebet_support,
      aggregator: 'hub88',
      provider,
      providerInternal: sourceGame.product.toLowerCase(),
      category: sourceGame.category,
      blacklist: sourceGame.blocked_countries,
      // doesn't look like this var exists
      hasFunMode: sourceGame.category === 'slots',
      live: sourceGame.has_live,
      payout: parseFloat((parseFloat(sourceGame.rtp) || 99.5).toFixed(2)),
      squareImage: sourceGame.squareImage,
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
