/**
 * The requests that Yggdrasil can perform.
 */
export type YggdrasilRequests = YggdrasilPlayerInfoRequest

/**
 * The operation to request mapping for Yggdrasil.
 */
export interface YggdrasilOpRequests {
  playerinfo: YggdrasilPlayerInfoRequest
  // Add new ones here
}

/**
 * The base request from Yggdrasil.
 */
export interface YggdrasilBaseRequest {
  /**
   * The organization the request is intended for.
   */
  org: string
  /**
   * The API version of the request.
   */
  version: number
}

/**
 * Determines if the input is a {@link YggdrasilBaseRequest}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilBaseRequest}.
 */
export function isYggdrasilBaseRequest(
  input: unknown,
): input is YggdrasilBaseRequest {
  return (
    !!input &&
    typeof input === 'object' &&
    'org' in input &&
    typeof input.org === 'string' &&
    input.org.length > 0
  )
}

/**
 * The base authenticatable request from Yggdrasil.
 */
export interface YggdrasilBaseSessionRequest extends YggdrasilBaseRequest {
  /**
   * The session token to authenticate the request.
   * This **should** be a JWT we signed and issued in the `playerinfo` request.
   */
  sessionToken: string
}

/**
 * Determines if the input is a {@link YggdrasilBaseSessionRequest}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilBaseSessionRequest}.
 */
export function isYggdrasilBaseSessionRequest(
  input: unknown,
): input is YggdrasilBaseSessionRequest {
  return (
    isYggdrasilBaseRequest(input) &&
    'sessionToken' in input &&
    typeof input.sessionToken === 'string' &&
    input.sessionToken.length > 0
  )
}

/**
 * A Yggdrasil request with a language.
 */
export interface YggdrasilLangRequest extends YggdrasilBaseRequest {
  /**
   * The language of the player the request is made on behalf of.
   */
  lang: string
}

/**
 * Determines if the input is a {@link YggdrasilLangRequest}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilLangRequest}, otherwise false.
 */
export function isYggdrasilLangRequest(
  input: unknown,
): input is YggdrasilLangRequest {
  return (
    isYggdrasilBaseRequest(input) &&
    'lang' in input &&
    typeof input.lang === 'string' &&
    input.lang.length === 2
  )
}

export interface YggdrasilCatTagRequest extends YggdrasilBaseRequest {
  /**
   * The categories of the game for the request.
   */
  categories: string[]
  /**
   * The tags of the game for the request.
   */
  tags: string[]
}

/**
 * Determines if the input is a {@link YggdrasilCatTagRequest}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilCatTagRequest}.
 */
export function isYggdrasilCatTagRequest(
  input: unknown,
): input is YggdrasilCatTagRequest {
  return (
    isYggdrasilBaseRequest(input) &&
    'categories' in input &&
    Array.isArray(input.categories) &&
    input.categories.every(cat => typeof cat === 'string') &&
    'tags' in input &&
    Array.isArray(input.tags) &&
    input.tags.every(tag => typeof tag === 'string')
  )
}

/**
 * The player info request from Yggdrasil
 */
export interface YggdrasilPlayerInfoRequest
  extends YggdrasilBaseSessionRequest,
    YggdrasilLangRequest,
    YggdrasilCatTagRequest {}

/**
 * Determines if the input is a {@link YggdrasilPlayerInfoRequest}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilPlayerInfoRequest}.
 */
export function isYggdrasilPlayerInfoRequest<T = YggdrasilPlayerInfoRequest>(
  input: unknown,
): input is T {
  return isYggdrasilBaseSessionRequest(input) && isYggdrasilLangRequest(input)
}
