import * as t from 'io-ts'

const ValidationFailResponseV = t.type({
  statusCode: t.literal(400),
  message: t.literal(
    'Request validation failed. Please see data for additional information.',
  ),
  errorCode: t.literal('validation.failed'),
  data: t.array(t.any),
})
export type ValidationFailResponse = t.TypeOf<typeof ValidationFailResponseV>

const UnauthorizedResponseV = t.union([
  t.type({
    statusCode: t.literal(401),
    errorCode: t.literal('subscription.not.active'),
    message: t.literal('Subscription not active anymore.'),
  }),
  t.type({
    statusCode: t.literal(401),
    errorCode: t.literal('subscription.invalid'),
    message: t.string,
  }),
])
export type UnauthorizedResponse = t.TypeOf<typeof UnauthorizedResponseV>

const ForbiddenResponseV = t.type({
  statusCode: t.literal(403),
  errorCode: t.literal('blockchain.error.code'),
  message: t.string,
})
export type ForbiddenResponse = t.TypeOf<typeof ForbiddenResponseV>

const InternalErrorResponseV = t.type({
  statusCode: t.literal(500),
  message: t.literal('Internal server error'),
})
export type InternalErrorResponse = t.TypeOf<typeof InternalErrorResponseV>

export const ErrorResponseV = t.union([
  ValidationFailResponseV,
  UnauthorizedResponseV,
  ForbiddenResponseV,
  InternalErrorResponseV,
])
export type ErrorResponse = t.TypeOf<typeof ErrorResponseV>
