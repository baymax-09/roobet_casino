import { type YggdrasilOpRequests, type YggdrasilOpResponses } from '.'
import { handleYggdrasilPlayerInfo } from '../lib/events/playerInfo'

/**
 * The operations that Yggdrasil can perform with requests and responses.
 */
export type YggdrasilOps = keyof YggdrasilOpResponses &
  keyof YggdrasilOpRequests

/**
 * The type for the Yggdrasil operations handlers.
 */
export type YggdrasilHandler<T extends YggdrasilOps> = (
  req: YggdrasilOpRequests[T],
) => Promise<YggdrasilOpResponses[T]>

/**
 * The type for the Yggdrasil operations map.
 */
export type YggdrasilOpsMapType = {
  [key in YggdrasilOps]: YggdrasilHandler<key>
}

/**
 * The parser map for Yggdrasil operations.
 */
export const YggdrasilOpsHandlerMap: YggdrasilOpsMapType = {
  playerinfo: handleYggdrasilPlayerInfo,
}
