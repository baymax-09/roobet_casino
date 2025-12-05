import { type Types as UserTypes } from 'src/modules/user'
import { createAuthToken } from '../lib/auth'

const urlProto = 'https://'
const urlPath = '/init/launchClient.html?'
const urlTldPrimary = '.yggdrasilgaming.com'
const urlTldSecondary = '.prod-ygg.com'
const domains = {
  test: {
    malta: `staticstaging${urlTldPrimary}`,
    gibraltar: `staticstaginggib${urlTldPrimary}`,
    curacao: `staticstagingcw${urlTldPrimary}`,
    uk: `staticstaginguk${urlTldPrimary}`,
    italy: `staticstagingmtit${urlTldPrimary}`,
    denmark: `staticstagingdk${urlTldPrimary}`,
    sweeden: `staticstagingse${urlTldPrimary}`,
    spain: `staticstaginges${urlTldPrimary}`,
    czech: `staticstagingcz${urlTldPrimary}`,
    latam: `staticstaging${urlTldPrimary}`,
  },
  live: {
    malta: `staticlive${urlTldPrimary}`,
    gibraltar: `staticlivegib${urlTldPrimary}`,
    curacao: `staticlivecw${urlTldPrimary}`,
    uk: `staticliveuk${urlTldPrimary}`,
    italy: `staticlivemtit${urlTldPrimary}`,
    denmark: `staticlivedk${urlTldPrimary}`,
    sweeden: `staticlivese${urlTldPrimary}`,
    spain: `staticlivees${urlTldPrimary}`,
    czech: `staticlivecz${urlTldPrimary}`,
    latam: `static-co${urlTldSecondary}`,
  },
  fun: {
    malta: `staticpff${urlTldPrimary}`,
    gibraltar: `staticpffgib${urlTldPrimary}`,
    curacao: `staticpffcw${urlTldPrimary}`,
    uk: `staticpffuk${urlTldPrimary}`,
    italy: `staticpffit${urlTldPrimary}`,
    denmark: `staticpffdk${urlTldPrimary}`,
    sweeden: `staticpffse${urlTldPrimary}`,
    spain: `staticpffes${urlTldPrimary}`,
    czech: `staticpffcz${urlTldPrimary}`,
    latam: `staticpff${urlTldPrimary}`,
  },
}

/**
 * The intent of the URL.
 */
export type YggdrasilUrlIntentType = keyof typeof domains

/**
 * Check if the given value is a {@link YggdrasilUrlIntentType}.
 * @param value The value to check.
 * @returns `true` if the value is a {@link YggdrasilUrlIntentType}, `false` otherwise.
 */
export function isYggdrasilUrlIntentType(
  value: any,
): value is YggdrasilUrlIntentType {
  return Object.keys(domains).includes(value)
}

/**
 * The intents of a URL.
 */
export const YggdrasilUrlIntents = Object.keys(domains).filter(
  isYggdrasilUrlIntentType,
)

/**
 * A map of game modes to intents.
 */
export const GameModeIntentMap: Record<string, YggdrasilUrlIntentType> = {
  live: 'live',
  demo: 'fun',
  test: 'test',
}

/**
 * The region of the URL.
 */
export type YggdrasilUrlRegionType =
  | keyof typeof domains.test
  | keyof typeof domains.live
  | keyof typeof domains.fun

/**
 * Check if the given value is a {@link YggdrasilUrlRegionType}.
 * @param value The value to check.
 * @returns `true` if the value is a {@link YggdrasilUrlRegionType}, `false` otherwise.
 */
export function isYggdrasilUrlRegionType(
  value: any,
): value is YggdrasilUrlRegionType {
  return Object.keys(domains.test)
    .concat(Object.keys(domains.live))
    .concat(Object.keys(domains.fun))
    .includes(value)
}

/**
 * The regions of a URL.
 */
export const YggdrasilUrlRegions = Object.keys(domains.test)
  .concat(Object.keys(domains.live))
  .concat(Object.keys(domains.fun))
  .filter(isYggdrasilUrlRegionType)

/**
 * Get a Yggdrasil URL.
 * @param intent The {@link YggdrasilUrlIntentType intent} of the desired URL.
 * @param region The {@link YggdrasilUrlRegionType region} of the desired URL.
 * @returns The URL.
 */
export function getYggdrasilUrl(
  intent: YggdrasilUrlIntentType,
  region: YggdrasilUrlRegionType,
): URL {
  const domain = domains[intent][region]
  return new URL([urlProto, domain, urlPath].join(''))
}

/**
 * The Yggdrasil boolean type.
 */
export type YggdrasilYesNo = 'yes' | 'no'

/**
 * The Yggdrasil redirect type.
 */
export type YggdrasilTopSelf = 'top' | 'self'

/**
 * The Yggdrasil channel.
 */
export type YggdrasilChannel = 'pc' | 'mobile' | 'both'

/**
 * The Yggdrasil launch parameters.
 */
export interface YggdrasilLaunchParams {
  /**
   * The session's identifier.
   * @example '16160421121051050000'
   */
  key: string
  /**
   * The standard three-letter code that describes the currency used by the player.
   * @example 'EUR, PLN, GBP'
   */
  currency: string
  /**
   * The two-letter code that describes the language used by the player. The default value is `en`.
   * @example 'en, sv, pl'
   */
  lang: string
  /**
   * The game's identifier. You can find the list of games and game IDs in the game catalogue in the Client Zone.
   * @example 7301
   */
  gameId: number
  /**
   * The name of your brand.
   * @example 'roobet'
   */
  org: string
  /**
   * The player's device used for launching the game. The default value is `pc`.
   */
  channel: YggdrasilChannel
  /**
   * How much time passed in a game-play session. This value is shown in minutes. The default value is `0`.
   */
  reminderElapsed?: number
  /**
   * Indicates how often a reality check is made. This value is shown in minutes.
   * The first reality check activates after the time calculated by subtracting the `reminderElapsed` value from the `reminderInterval` value.
   * Next reality checks are activated after the time defined in the `reminderInterval` value.
   * If the value is `0`, the reality check is disabled. The default value is `60`.
   * @example 100, 40, 0
   */
  reminderInterval?: number
  /**
   * **Play-For-Fun (PFF) Only!**
   *
   * The name of your group.
   * @example 'roobet'
   */
  topOrg?: string
  /**
   * The link to the game history inside the reality check window.
   * If no link is specified, `clientHistoryURL` links to the in-game game history.
   */
  clientHistoryURL?: string
  /**
   * The redirection URL for the Reality Check STOP button.
   */
  realityCheckBackURL?: string
  /**
   * Indicates the type of redirection.Possible values:
   * - `self` - redirects to the game window
   * - `top` - redirects to the browser window
   *
   * The default value is `self`.
   */
  redirectType?: YggdrasilTopSelf
  /**
   * Indicates if the social media features are enabled. The default value is `yes`.
   */
  share?: YggdrasilYesNo
  /**
   * Indicates if the watch feature for the leaderboard of an active tournament is enabled. The default value is `yes`.
   */
  leaderboardRewatch?: YggdrasilYesNo
  /**
   * Indicates if additional features for particular licenses are enabled in the game client.
   *
   * **If the target country is not on this list, please contact the Yggdrasil Integration team and confirm the parameter to use.**
   *
   * @example 'de', 'uk', 'it', 'se', 'es', 'dk', 'mt', 'gib', 'cw', 'co', 'cz', 'fin', 'lt', 'gr', 'agcc', 'ch', 'nl'
   */
  license?: string
}

/**
 * The Yggdrasil launch parameters for mobile devices.
 */
export interface YggdrasilLaunchParamsMobile extends YggdrasilLaunchParams {
  channel: 'mobile'
  /**
   * The redirection URL for the home button, and for the Reality Check STOP button, if realityCheckBackURL is not specified.
   * @example 'https://www.roobet.com/casino'
   */
  home: string
}

/**
 * The Yggdrasil launch parameters for desktop devices.
 */
export interface YggdrasilLaunchParamsDesktop extends YggdrasilLaunchParams {
  channel: 'pc'
  /**
   * Indicates if the full screen mode is enabled. The default value is `no`.
   */
  fullscreen: YggdrasilYesNo
}

/**
 * Reduces the {@link params} and transforms them to Yggdrasil expectations.
 * @param params The {@link YggdrasilLaunchParams launch parameters} to conform.
 * @returns The conformed parameters.
 * @description The {@link YggdrasilLaunchParams launch parameters} are case-sensitive.
 * This function reduces the {@link params} and transforms them to Yggdrasil's lowercase expectations.
 */
function getConformedParams<T extends YggdrasilLaunchParams>(params: T) {
  return Object.entries(params).reduce(
    (pre, cur) => ({
      ...pre,
      ...(cur[1] ? { [cur[0].toLowerCase()]: cur[1] } : {}),
    }),
    {},
  )
}

/**
 * Get a Yggdrasil launch URL.
 * @param intent The {@link YggdrasilUrlIntentType intent} of the desired URL.
 * @param region The {@link YggdrasilUrlRegionType region} of the desired URL.
 * @param params The {@link YggdrasilLaunchParams launch parameters} for the URL.
 * @returns The URL.
 */
export function getYggdrasilLaunchUrl<T extends YggdrasilLaunchParams>(
  intent: YggdrasilUrlIntentType,
  region: YggdrasilUrlRegionType,
  params: T,
): URL {
  const url = getYggdrasilUrl(intent, region)
  const useParams = getConformedParams<T>(params)
  const query = new URLSearchParams(useParams)
  return new URL([url, query.toString()].join(''))
}

/**
 * Get a Yggdrasil launch URL.
 * @param intent The {@link YggdrasilUrlIntentType intent} of the desired URL.
 * @param region The {@link YggdrasilUrlRegionType region} of the desired URL.
 * @param params The {@link YggdrasilLaunchParams launch parameters} for the URL.
 * @returns The URL.
 */
export function getYggdrasilLaunchUrlForUser<T extends YggdrasilLaunchParams>(
  intent: YggdrasilUrlIntentType,
  region: YggdrasilUrlRegionType,
  params: T,
  user: UserTypes.User,
): { url: URL; token: string } {
  const sessionKey = createAuthToken(user)
  const finalParams: T = { ...params, key: sessionKey }
  const url = getYggdrasilLaunchUrl(intent, region, finalParams)
  return { url, token: sessionKey }
}
