import { type LengthString } from './common'
import { type YggdrasilChannel } from './urls'

/**
 * The error codes that can be returned by the callbacks.
 *
 * The game server cancels or retries the transaction for
 * the following codes: `1000`, `1007`, `1008`, `1013`, and `1`.
 */
export enum YggdrasilErrorCodes {
  /**
   * The in-game error message is logged for system maintenance.
   *
   * **User Message**: _"A technical error occurred when processing the request. Please contact support."_
   */
  AnyOtherError = 1,
  /**
   * The session key is not valid.
   *
   * **User Message**: _"A technical error occurred when processing the request. Please contact support."_
   */
  NotLoggedIn = 1000,
  /**
   * The player does not have sufficient funds in the requested currency.
   * The in-game error message is displayed. If possible, the player is directed to where they deposit money.
   *
   * **User Message**: _"You do not have sufficient funds for the bet."_
   */
  Overdraft = 1006,
  /**
   * The player cannot play the game, for example, because of the responsible gaming limits.
   * The in-game error message is displayed. The game client is closed.
   *
   * **User Message**: _"The account is blocked and no bets can be performed."_
   */
  Blocked = 1007,
  /**
   * The player is not authorized to make this bet.
   *
   * **User Message**: _"You are not allowed to perform the bet due to gaming limits."_
   */
  NotAuthorized = 1008,
  /**
   * The player cannot place the bet because the bet exceeds the maximum value for bonus money.
   *
   * **User Message**: _"You cannot place this bet due to max bet limit on bonus funds."_
   */
  BonusLimit = 1013,
}

/**
 * The response types that Yggdrasil can receive.
 */
export type YggdrasilResponses = YggdrasilPlayerInfoResponse

/**
 * The operation to response mapping for Yggdrasil.
 */
export interface YggdrasilOpResponses {
  playerinfo: YggdrasilPlayerInfoResponse
  // Add new ones here
}

/**
 * Possible values for the {@link YggdrasilPopupMessageButton.actionType} property.
 */
export type YggdrasilPopupMessageButtonActionType = 'REDIRECT' | 'CLOSE'

/**
 * An actionable button that can be displayed in a popup message.
 */
export interface YggdrasilPopupMessageButton {
  /**
   * The name of a button displayed in the optional popup message.
   *
   * For example: `TERMS`, `CLOSE`.
   */
  label: LengthString<11>
  /**
   * Defines what happens when you select a button displayed in the optional popup message.
   *
   * Possible values:
   * - `REDIRECT`: Redirects to a specific URL.
   * - `CLOSE`: Closes the optional popup message.
   */
  actionType: YggdrasilPopupMessageButtonActionType
  /**
   * If {@link YggdrasilPopupMessageButton.actionType} has the `REDIRECT` value,
   * then the value for this field shows a redirection URL.
   *
   * If {@link YggdrasilPopupMessageButton.actionType} has the `CLOSE` value,
   * then the value for this field is null.
   */
  url: URL
}

/**
 * A popup message that can be displayed in the game client.
 * @description An optional popup message informing the player that:
 * - The next bet is greater than the bonus money balance.
 * - The next bet is paid with real money.
 *
 * The contents of the optional popup message are set by the operator.
 */
export interface YggdrasilPopupMessage {
  /**
   * The title of the optional popup message.
   */
  title: LengthString<30>
  /**
   * The content of the optional popup message.
   */
  content: LengthString<86>
  buttons: YggdrasilPopupMessageButton[]
  channel: YggdrasilChannel
}

/**
 * A callback error response to Yggdrasil.
 */
export interface YggdrasilErrorResponse {
  /**
   * The error code.
   *
   * If the request is valid, the value for this parameter is `0`.
   * Max length `5` digits.
   */
  code: YggdrasilErrorCodes | number
  /**
   * Shows the error message.
   *
   * Valid if the value of code is not `0`. Max length `100` characters.
   */
  msg: LengthString<100>
}

/**
 * A callback response data to Yggdrasil.
 */
export interface YggdrasilBaseResponseData {
  /**
   * The player's identifier returned by the operator's transaction server.
   *
   * For UUIDv4, the length is `36` characters, strip the hyphens for `32`.
   */
  playerId: LengthString<32>
  /**
   * The organization's identifier.
   */
  organization: LengthString<32>
  /**
   * The amount of money the player can withdraw.
   */
  balance: number
  /**
   * The amount of bonus money the player can use in the game specified in the request.
   */
  applicableBonus?: number
  /**
   * The standard three-letter code that describes the currency of the game.
   * The `currency` and `homeCurrency` fields have the same value.
   */
  currency: LengthString<3>
  /**
   * The standard three-letter code that describes the currency of the game.
   * The `currency` and `homeCurrency` fields have the same value.
   */
  homeCurrency: LengthString<3>
}

/**
 * A callback response data to the Yggdrasil `playerinfo` request.
 */
export interface YggdrasilPlayerInfoResponseData
  extends YggdrasilBaseResponseData {
  /**
   * The standard two-letter code that describes the country of the player.
   * The value is based on the {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 ISO 3166-1 alfa-2} codes.
   */
  country: LengthString<2>
  /**
   * The round's identifier displayed in the game.
   */
  gameHistorySessionId?: LengthString<64>
  /**
   * The spin's identifier displayed in the game.
   */
  gameHistoryTicketId?: LengthString<64>
  /**
   * An optional popup message informing the player that:
   * - The next bet is greater than the bonus money balance.
   * - The next bet is paid with real money.
   *
   * The contents of the optional popup message are set by the operator.
   */
  popupMessage?: YggdrasilPopupMessage
}

/**
 * A callback success response to Yggdrasil.
 */
export interface YggdrasilBaseResponse<T extends YggdrasilBaseResponseData> {
  /**
   * The error code.
   *
   * If the request is valid, the value for this parameter is `0`.
   * Max length `5` digits.
   */
  code: 0
  /**
   * The response data.
   */
  data: T
}

/**
 * A callback response to the Yggdrasil `playerinfo` response.
 */
export interface YggdrasilPlayerInfoResponse
  extends YggdrasilBaseResponse<YggdrasilPlayerInfoResponseData> {}
