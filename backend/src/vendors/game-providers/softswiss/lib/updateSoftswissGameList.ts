import fetch from 'node-fetch'
import yaml from 'yaml'
import moment from 'moment'

import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdateRecalls,
} from 'src/modules/tp-games/lib'
import { humanReadableProvider } from './constants'
import { softswissLogger } from './logger'

const sources = [
  'https://cdn.softswiss.net/l/softswiss.yaml',
  'https://cdn.softswiss.net/l/netent.yaml',
  // 'https://cdn.softswiss.net/l/playngo.yaml', We integrate with Playngo directly
  // 'https://cdn.softswiss.net/l/pragmatic.yaml',
  // 'https://cdn.softswiss.net/l/gameart.yaml', We integrate with GameArt through Hub88 already
  'https://cdn.softswiss.net/l/quickspin.yaml',
  'https://cdn.softswiss.net/l/relax.yaml',
  'https://cdn.softswiss.net/l/thunderkick.yaml',
  'https://cdn.softswiss.net/l/evolution.yaml',
  'https://cdn.softswiss.net/l/infin.yaml',
  // 'https://cdn.softswiss.net/l/epicmedia.yaml', We integrate with Epicmedia/Blueprint through Hub88, see ROOB-1002
  'https://cdn.softswiss.net/l/nolimit.yaml',
  'https://cdn.softswiss.net/l/elk.yaml',
  'https://cdn.softswiss.net/l/pushgaming.yaml',
  'https://cdn.softswiss.net/l/bsg.yaml',
  'https://cdn.softswiss.net/l/mascot.yaml',
  'https://cdn.softswiss.net/l/avatarux.yaml',
  'https://cdn.softswiss.net/l/1spin4win.yaml',
  'https://cdn.softswiss.net/l/amatic.yaml',
  'https://cdn.softswiss.net/l/redgenn.yaml',
  'https://cdn.softswiss.net/l/3oaks.yaml',
  'https://cdn.softswiss.net/l/spinza.yaml',
  'https://cdn.softswiss.net/l/gamingcorps.yaml',
  'https://cdn.softswiss.net/l/spinomenal.yaml',
  'https://cdn.softswiss.net/l/wazdan.yaml',
  'https://cdn.softswiss.net/l/gamzix.yaml',
  'https://cdn.softswiss.net/l/popiplay.yaml',
  'https://cdn.softswiss.net/l/truelab.yaml',
  'https://cdn.softswiss.net/l/vibragaming.yaml',
  'https://cdn.softswiss.net/l/clawbuster.yaml',
  'https://cdn.softswiss.net/l/1x2gaming.yaml',
  'https://cdn.softswiss.net/l/quickfire.yaml',
  'https://cdn.softswiss.net/l/highfive.yaml',
] as const

const includeSourceGame = (sourceGame: any): boolean => {
  if (
    sourceGame.released_at &&
    sourceGame.released_at > moment().format('YYYY-MM-DD')
  ) {
    return false
  }

  if (sourceGame.title.includes('HR')) {
    return false
  }

  // Providers to skip
  if (
    sourceGame.provider === 'epicmedia' &&
    sourceGame.producer !== 'blueprint'
  ) {
    return false
  }

  // Is this even necessary if we don't include their yaml files above?
  const providersToSkip = ['playngo', 'pragmatic', 'plankgaming', 'hacksaw']
  if (providersToSkip.includes(sourceGame.provider)) {
    return false
  }
  // -- End providers to skip

  // Producers to skip
  const producersToSkip = ['gameart', 'plankgaming', 'yggdrasil']
  if (producersToSkip.includes(sourceGame.producer)) {
    return false
  }
  // -- End producers to skip

  const providerProducerPairsToSkip = [
    { provider: 'relax', producer: 'pushgaming' },
    { provider: 'relax', producer: 'hacksaw' },
    { provider: 'infin', producer: 'booongo' },
    { provider: 'redgenn', producer: 'booongo' },
    { provider: 'yggdrasil', producer: 'reelplay' },
  ]
  if (
    providerProducerPairsToSkip.some(({ provider, producer }) => {
      return (
        sourceGame.producer === producer && sourceGame.provider === provider
      )
    })
  ) {
    return false
  }

  const titlesToExcludeNetent = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']
  if (
    sourceGame.provider === 'netent' &&
    titlesToExcludeNetent.some(titleSegment =>
      sourceGame.identifier.includes(titleSegment),
    )
  ) {
    return false
  }

  // We only want 96% No Limit slots games
  if (sourceGame.provider === 'nolimit' && sourceGame.payout < 96) {
    return false
  }

  return true
}

const transformSourceGame = (sourceGame: any) => {
  const newGame = structuredClone(sourceGame)
  // Apply category
  if (sourceGame.title.toLowerCase().includes('blackjack')) {
    newGame.category = 'blackjack'
  }
  if (sourceGame.title.toLowerCase().includes('bj')) {
    newGame.category = 'blackjack'
  }
  if (sourceGame.identifier === 'evolution:lightning_roulette_flash') {
    newGame.category = 'roulette - special'
  }
  if (sourceGame.identifier === 'evolution:lightning_roulette') {
    newGame.category = 'roulette - special'
  }
  // -- End category

  // Arbitrary modifications
  switch (sourceGame.producer) {
    case 'evolution':
      newGame.restrictions.default.blacklist.push('SE')
      break
    default:
  }

  // Note: Softswiss uses confusing terminology that does NOT match all of the other aggregator/providers.
  newGame.providerInternal = sourceGame.producer

  // Human Readable Provider
  newGame.provider = humanReadableProvider(sourceGame.producer)

  if (sourceGame.identifier === 'evolution:dealnodeal') {
    newGame.devices = ['mobile', 'desktop']
  }

  if (
    [
      'netent:deadoralive2fb_not_mobile_sw',
      'netent:deadoralive2fb_mobile_html_sw',
    ].includes(sourceGame.identifier)
  ) {
    newGame.title = 'Dead or Alive 2'
  }

  // Apply payout(100 - RTP)
  if (sourceGame.identifier.toLowerCase().includes('monopoly')) {
    newGame.payout = 97.5
  }
  if (sourceGame.identifier.toLowerCase().includes('lightning')) {
    newGame.payout = 97.5
  }
  if (sourceGame.identifier.toLowerCase().includes('dream')) {
    newGame.payout = 97.5
  }
  if (sourceGame.identifier.toLowerCase().includes('deal')) {
    newGame.payout = 97.5
  }
  if (sourceGame.identifier.toLowerCase().includes('crazy')) {
    newGame.payout = 97.5
  }
  if (sourceGame.identifier.toLowerCase().includes('mega')) {
    newGame.payout = 97.5
  }
  if (sourceGame.category === 'lottery') {
    newGame.payout = 97
  }
  if (sourceGame.category === 'roulette') {
    newGame.payout = 97.3
  }
  if (sourceGame.category === 'blackjack' || sourceGame.category === 'card') {
    newGame.payout = 99.5
  }
  if (sourceGame.identifier.toLowerCase().includes('baccarat')) {
    newGame.payout = 99
  }
  // -- End payout

  return newGame
}

export const updateSoftswissGameList: GameUpdater = async () => {
  const games: GameUpdaterGames = {}
  const recalls: GameUpdateRecalls = []

  for (const source of sources) {
    try {
      const response = await fetch(source)
      const yamlPlainText = await response.text()
      const sourceGames = yaml.parse(yamlPlainText)

      for (const sourceGame of sourceGames) {
        if (sourceGame.recalled) {
          // Delete game if exists.
          recalls.push({ identifier: sourceGame.identifier })
        }

        if (!includeSourceGame(sourceGame)) {
          continue
        }

        const transformedGame = transformSourceGame(sourceGame)

        games[transformedGame.identifier] = {
          gid: transformedGame.identifier,
          title: transformedGame.title,
          devices: transformedGame.devices,
          hasFreespins: transformedGame.has_freespins,
          aggregator: 'softswiss',
          provider: transformedGame.provider,
          category: transformedGame.category,
          blacklist: transformedGame.restrictions.default.blacklist,
          hasFunMode: !transformedGame.has_live,
          live: transformedGame.has_live,
          providerInternal: transformedGame.providerInternal,
          payout: parseFloat(
            (parseFloat(transformedGame.payout) || 99.5).toFixed(2),
          ),
          squareImage: `https://cdn.softswiss.net/i/s3/${sourceGame.provider}/${
            transformedGame.identifier.split(':')[1]
          }.png`,
        }
      }
    } catch (error) {
      softswissLogger('updateSoftswissGameList', { userId: null }).error(
        `Failed to fetch source ${source}.`,
        { source },
        error,
      )
    }
  }

  return {
    games,
    recalls,
  }
}
