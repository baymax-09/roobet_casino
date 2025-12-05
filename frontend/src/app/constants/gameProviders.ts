import { type DeepReadonly } from 'ts-essentials'

/**
 * Preset list of game providers
 */
import playngo from 'assets/images/providers/playngo.png'
import redTiger from 'assets/images/providers/red-tiger.png'
import netnet from 'assets/images/providers/netent.png'
import quickspin from 'assets/images/providers/quickspin.png'
import pragmaticPlay from 'assets/images/providers/pragmatic-play.png'
import relax from 'assets/images/providers/relax.png'
import bgaming from 'assets/images/providers/bgaming.png'
import blueprint from 'assets/images/providers/blueprint.png'
import thunderkick from 'assets/images/providers/thunderkick.png'
import elk from 'assets/images/providers/elk.png'
import noLimitCity from 'assets/images/providers/no-limit-city.png'
import evoplay from 'assets/images/providers/evoplay.png'
import bigTimeGaming from 'assets/images/providers/big-time-gaming.png'
import pushGaming from 'assets/images/providers/push-gaming.png'
import caletaGaming from 'assets/images/providers/caleta-gaming.png'
import avatarux from 'assets/images/providers/avatarux.png'
import hacksawGaming from 'assets/images/providers/hacksaw-gaming.png'
import betsoft from 'assets/images/providers/betsoft.png'
import oneSpinForWin from 'assets/images/providers/1Spin4Win.png'
import amaticIndustries from 'assets/images/providers/amatic.png'
import onetouch from 'assets/images/providers/onetouch.png'
import redRake from 'assets/images/providers/redrake.png'
import habanero from 'assets/images/providers/habanero.png'
import gamzix from 'assets/images/providers/gamzix.png'
import playson from 'assets/images/providers/playson.png'
import wazdan from 'assets/images/providers/wazdan.png'
import spinomenal from 'assets/images/providers/spinomenal.png'
import retrogaming from 'assets/images/providers/retrogaming.png'
import truelab from 'assets/images/providers/truelab.png'
import rogue from 'assets/images/providers/rogue.png'
import popiplay from 'assets/images/providers/popiplay.png'
import octoplay from 'assets/images/providers/octoplay.png'
import spinza from 'assets/images/providers/spinza.png'
import booming from 'assets/images/providers/booming.png'
import genii from 'assets/images/providers/genii.png'
import gamomat from 'assets/images/providers/gamomat.png'
import endorphina from 'assets/images/providers/endorphina.png'
import { getCachedSrc } from 'common/util'

export type GameProviders = typeof GAME_PROVIDERS

export interface GameProviderConfiguration {
  title: string
  path: string
  logo?: string
}

// The commented out providers are currently disabled across the board, but they could be re-enabled.
// Keeping them here until this list is no longer used for the search provider dropdown filter.
export const GAME_PROVIDERS: DeepReadonly<
  Record<string, GameProviderConfiguration>
> = {
  'pragmatic play': {
    title: 'Pragmatic Play',
    path: 'pragmatic-play',
    logo: getCachedSrc({ src: pragmaticPlay }),
  },
  'hacksaw gaming': {
    title: 'Hacksaw Gaming',
    path: 'hacksaw-gaming',
    logo: getCachedSrc({ src: hacksawGaming }),
  },
  "play'n go": {
    title: "Play'n Go",
    path: 'playngo',
    logo: getCachedSrc({ src: playngo }),
  },
  'nolimit city': {
    title: 'Nolimit City',
    path: 'nolimit-city',
    logo: getCachedSrc({ src: noLimitCity }),
  },
  'push gaming': {
    title: 'Push Gaming',
    path: 'push-gaming',
    logo: getCachedSrc({ src: pushGaming }),
  },
  bgaming: {
    title: 'BGaming',
    path: 'bgaming',
    logo: getCachedSrc({ src: bgaming }),
  },
  'red tiger': {
    title: 'Red Tiger',
    path: 'red-tiger',
    logo: getCachedSrc({ src: redTiger }),
  },
  high5: {
    title: 'High5',
    path: 'high5',
    logo: undefined,
  },
  netent: {
    title: 'Netent',
    path: 'netent',
    logo: getCachedSrc({ src: netnet }),
  },
  quickspin: {
    title: 'Quickspin',
    path: 'quickspin',
    logo: getCachedSrc({ src: quickspin }),
  },
  relax: {
    title: 'Relax',
    path: 'relax',
    logo: getCachedSrc({ src: relax }),
  },
  playson: {
    title: 'Playson',
    path: 'playson',
    logo: playson,
  },
  blueprint: {
    title: 'Blueprint Gaming',
    path: 'blueprint',
    logo: getCachedSrc({ src: blueprint }),
  },
  thunderkick: {
    title: 'Thunderkick',
    path: 'thunderkick',
    logo: getCachedSrc({ src: thunderkick }),
  },
  // pgsoft: {
  //   title: 'PG Soft',
  //   path: 'pgsoft',
  //   logo: undefined,
  // },
  elk: {
    title: 'Elk',
    path: 'elk',
    logo: getCachedSrc({ src: elk }),
  },
  'evoplay entertainment': {
    title: 'Evoplay Entertainment',
    path: 'evoplay-entertainment',
    logo: getCachedSrc({ src: evoplay }),
  },
  // leander: {
  //   title: 'Leander',
  //   path: 'leander',
  //   logo: undefined,
  // },
  reelplay: {
    title: 'Reelplay',
    path: 'reelplay',
    logo: undefined,
  },
  'big time gaming': {
    title: 'Big Time Gaming',
    path: 'big-time-gaming',
    logo: getCachedSrc({ src: bigTimeGaming }),
  },
  'caleta gaming': {
    title: 'Caleta Gaming',
    path: 'caleta-gaming',
    logo: getCachedSrc({ src: caletaGaming }),
  },
  // igrosoft: {
  //   title: 'Igrosoft',
  //   path: 'igrosoft',
  //   logo: undefined,
  // },
  // bet2tech: {
  //   title: 'Bet2tech',
  //   path: 'bet2tech',
  //   logo: undefined,
  // },
  // '4theplayer': {
  //   title: '4theplayer',
  //   path: '4theplayer',
  //   logo: undefined,
  // },
  // kalamba: {
  //   title: 'Kalamba',
  //   path: 'kalamba',
  //   logo: undefined,
  // },
  fantasma: {
    title: 'Fantasma',
    path: 'fantasma',
    logo: undefined,
  },
  avatarux: {
    title: 'Avatarux',
    path: 'avatarux',
    logo: getCachedSrc({ src: avatarux }),
  },
  betsoft: {
    title: 'Betsoft',
    path: 'betsoft',
    logo: getCachedSrc({ src: betsoft }),
  },
  '1spin4win': {
    title: '1spin4win',
    path: '1spin4win',
    logo: getCachedSrc({ src: oneSpinForWin }),
  },
  amatic: {
    title: 'Amatic',
    path: 'amatic',
    logo: getCachedSrc({ src: amaticIndustries }),
  },
  oneTouch: {
    title: 'OneTouch',
    path: 'one-touch',
    logo: getCachedSrc({ src: onetouch }),
  },
  redRakeGaming: {
    title: 'Red Rake Gaming',
    path: 'red-rake-gaming',
    logo: getCachedSrc({ src: redRake }),
  },
  habanero: {
    title: 'Habanero',
    path: 'habanero',
    logo: getCachedSrc({ src: habanero }),
  },
  gamzix: {
    title: 'Gamzix',
    path: 'gamzix',
    logo: gamzix,
  },
  wazdan: {
    title: 'Wazdan',
    path: 'wazdan',
    logo: wazdan,
  },
  spinomenal: {
    title: 'Spinomenal',
    path: 'spinomenal',
    logo: getCachedSrc({ src: spinomenal }),
  },
  retrogaming: {
    title: 'Retrogaming',
    path: 'retrogaming',
    logo: getCachedSrc({ src: retrogaming }),
  },
  truelab: {
    title: 'Truelab',
    path: 'truelab',
    logo: truelab,
  },
  rogue: {
    title: 'Rogue',
    path: 'rogue',
    logo: getCachedSrc({ src: rogue }),
  },
  popiplay: {
    title: 'Popiplay',
    path: 'popiplay',
    logo: popiplay,
  },
  octoplay: {
    title: 'Octoplay',
    path: 'octoplay',
    logo: octoplay,
  },
  Spinza: {
    title: 'Spinza',
    path: 'spinza',
    logo: spinza,
  },
  BoomingGames: {
    title: 'Booming Games',
    path: 'booming-games',
    logo: booming,
  },
  genii: {
    title: 'Genii',
    path: 'genii',
    logo: getCachedSrc({ src: genii }),
  },
  gamomat: {
    title: 'Gamomat',
    path: 'gamomat',
    logo: gamomat,
  },
  endorphina: {
    title: 'Endorphina',
    path: 'endorphina',
    logo: getCachedSrc({ src: endorphina }),
  },
} as const
