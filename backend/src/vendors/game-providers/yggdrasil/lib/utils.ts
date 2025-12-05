import { type Request } from 'express'
import * as path from 'path'
import { isValidCategory, type Category } from 'src/modules/bet/types'
import {
  YGGDRASIL_API_BASE_URL,
  YGGDRASIL_PROVIDER_NAME,
  YggdrasilError,
  YggdrasilInvalidGameIdError,
  YggdrasilInvalidOpError,
  YggdrasilOpValidatorMap,
  isYggdrasilOperation,
  type YggdrasilEvent,
  type YggdrasilOpValidatorType,
  type YggdrasilOperation,
  type YggdrasilRequests,
  type YggdrasilResponses,
} from '../types'
import { YggdrasilOpsHandlerMap } from './events'

const logScope = 'utils'

/**
 * Maps the Yggdrasil game type to a category, for known mismatches
 */
const yggGameTypeMap: Record<string, string> = {
  slot: 'slots',
}

/**
 * Regex to identify category attributes
 */
const catRegex = /cat\d/i

/**
 * Regex to identify tag attributes
 */
const tagRegex = /tag\d/i

/**
 * Maps the Yggdrasil attributes to a known internal attributes
 */
const yggAttribMap: Record<string, string> = {
  bonusprize: 'bonusPrize',
  campaignref: 'campaignRef',
  freespincount: 'freeSpinCount',
  freespinwin: 'freeSpinWin',
  isjackpotwin: 'isJackpotWin',
  jackpotcontribution: 'jackpotContribution',
  jackpotvalueafter: 'jackpotValueAfter',
  jackpotvaluebefore: 'jackpotValueBefore',
  playerid: 'playerId',
  prepaidcost: 'prepaidCost',
  prepaidref: 'prepaidRef',
  prepaidticketid: 'prepaidTicketId',
  prepaidvalue: 'prepaidValue',
  roundcount: 'roundCount',
  ruletype: 'ruleType',
  sessiontoken: 'sessionToken',
  singlewin: 'singleWin',
  totalwin: 'totalWin',
}

/**
 * Returns the internal id for a {@link gameId}
 * @param gameId The Yggdrasil game identifier
 * @returns The internal id
 * @example
 * ```ts
 * const stringId = internalIdForYggId('10522') // 'yggdrasil:10522'
 * const numberId = internalIdForYggId(10522) // 'yggdrasil:10522'
 * ```
 */
export function internalIdForYggId(
  gameId: string | number | undefined,
): string {
  if (
    gameId === undefined ||
    (typeof gameId === 'string' && gameId.trim() === '')
  ) {
    throw YggdrasilError.logAndReturn(
      new YggdrasilInvalidGameIdError(gameId ?? 'undefined', logScope),
    )
  }
  return `${YGGDRASIL_PROVIDER_NAME}:${gameId}`
}

/**
 * Converts the Yggdrasil game type to a {@link Category}
 * @param type The Yggdrasil game type
 * @returns The category
 */
export function yggdrasilTypeToCategory(type: string): Category {
  const finalType = yggGameTypeMap[type.toLowerCase()] ?? type
  if (isValidCategory(finalType)) {
    return finalType
  }

  return 'slots'
}

/**
 * Returns the Yggdrasil API Url for the {@link path} based on configuration.
 * @param path The relative path to the endpoint.
 * @returns The fully qualified API Url.
 * @example
 * ```ts
 * const gamesUrl = getApiUrl('games') // 'https://integration.stage-ygg.com/api/v1/games'
 * ```
 */
export function getApiUrl(path: string): string {
  return path && path.length > 0
    ? [YGGDRASIL_API_BASE_URL, path].join('/')
    : YGGDRASIL_API_BASE_URL
}

/**
 * Gets the operation from a {@link Request}.
 * @param req The request to parse.
 * @returns The operation from the request.
 * @throws An {@link YggdrasilInvalidOpError} if the operation is invalid.
 */
export function getYggdrasilOp(req: Request): YggdrasilOperation {
  const op = path.basename(req.path, '.json')
  if (isYggdrasilOperation(op)) {
    return op
  }
  throw YggdrasilError.logAndReturn(new YggdrasilInvalidOpError(op, logScope))
}

/**
 * Gets the {@link YggdrasilOpValidatorType validator} for a {@link YggdrasilOperation operation}.
 * @param op The {@link YggdrasilOperation operation} to get the validator for.
 * @returns The {@link YggdrasilOpValidatorType validator} for the operation.
 * @throws An {@link YggdrasilInvalidOpError} if the operation is invalid.
 */
export function getYggdrasilOpValidator(
  op: YggdrasilOperation,
): YggdrasilOpValidatorType {
  const validator = YggdrasilOpValidatorMap[op]
  if (!validator) {
    throw YggdrasilError.logAndReturn(new YggdrasilInvalidOpError(op, logScope))
  }
  return validator
}

/**
 * Gets the validator for a {@link Request}.
 * @param req The request to parse.
 * @returns The validator for the request.
 */
export function getYggdrasilValidator(req: Request): YggdrasilOpValidatorType {
  const op = getYggdrasilOp(req)
  return getYggdrasilOpValidator(op)
}

/**
 * Parses the query string from a {@link Request} into an object.
 * @param req The request to parse.
 * @returns The operation and data from the query string.
 */
export function parseQueryToObject(req: Request): {
  op: YggdrasilOperation
  data: unknown
} {
  const op = getYggdrasilOp(req)
  const url = new URL(req.url, `http://${req.headers.host}`)
  const data: Record<string, unknown> = {}
  const categories: string[] = []
  const tags: string[] = []
  for (const [key, value] of url.searchParams.entries()) {
    const finalKey = yggAttribMap[key.toLowerCase()] ?? key
    if (catRegex.test(finalKey)) {
      categories.push(value)
    } else if (tagRegex.test(finalKey)) {
      tags.push(value)
    } else {
      data[finalKey] = value
    }
  }

  if (categories.length > 0) {
    data.categories = categories
  }

  if (tags.length > 0) {
    data.tags = tags
  }

  return { op, data }
}

/**
 * Gets the {@link YggdrasilEvent} from a {@link Request}.
 * @param req The {@link Request} to parse.
 * @param validator The validator for the request.
 * @returns The {@link YggdrasilEvent} from the request.
 * @throws An {@link YggdrasilInvalidOpError} if the operation is invalid,
 * or the data fails to validate against the operations type.
 */
export function getYggdrasilEvent<
  TReq extends YggdrasilRequests,
  TRes extends YggdrasilResponses,
>(
  req: Request,
  validator: (input: unknown) => input is TReq,
): YggdrasilEvent<TReq, TRes> {
  const { op, data } = parseQueryToObject(req)
  const result = validator(data)
  if (result) {
    return {
      op,
      ts: Date.now(),
      data,
      handler: YggdrasilOpsHandlerMap[op],
    }
  }

  throw YggdrasilError.logAndReturn(new YggdrasilInvalidOpError(op, logScope))
}
