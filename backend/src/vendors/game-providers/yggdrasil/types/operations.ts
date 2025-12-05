import { type YggdrasilHandler } from '../lib/events'
import {
  isYggdrasilPlayerInfoRequest,
  type YggdrasilRequests,
} from './requests'
import { type YggdrasilResponses } from './responses'

/**
 * The operations that Yggdrasil can perform.
 */
export const YggdrasilOperations = ['playerinfo'] as const

/**
 * The type for operations that Yggdrasil can perform.
 */
export type YggdrasilOperation = (typeof YggdrasilOperations)[number]

/**
 * Determines if the input is a {@link YggdrasilOperation}.
 * @param input The input to check.
 * @returns True if the input is a {@link YggdrasilOperation}.
 */
export function isYggdrasilOperation(input: any): input is YggdrasilOperation {
  return YggdrasilOperations.includes(input)
}

/**
 * The validator type for Yggdrasil operation data.
 */
export type YggdrasilOpValidatorType = <T extends YggdrasilRequests>(
  input: unknown,
) => input is T

/**
 * The parser map type for Yggdrasil operations.
 */
export type YggdrasilOpValidatorMapType = Record<
  YggdrasilOperation,
  YggdrasilOpValidatorType
>

/**
 * The parser map for Yggdrasil operations.
 */
export const YggdrasilOpValidatorMap: YggdrasilOpValidatorMapType = {
  playerinfo: isYggdrasilPlayerInfoRequest,
}

/**
 * An Yggdrasil callback event.
 */
export interface YggdrasilEvent<
  TReq extends YggdrasilRequests,
  TRes extends YggdrasilResponses,
> {
  op: YggdrasilOperation
  ts: number
  data: TReq
  handler: YggdrasilHandler<YggdrasilOperation>
}
