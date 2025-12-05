export const StatusCodes = {
  /** Successful response. */
  RS_OK: 'RS_OK',
  /** General error status, for cases without a special error code. */
  RS_ERROR_UNKNOWN: 'RS_ERROR_UNKNOWN',
  /** Operator or their sub_partner is disabled or incorrect sub_partner_id is sent. */
  RS_ERROR_INVALID_PARTNER: 'RS_ERROR_INVALID_PARTNER',
  /** Token unknown to Operator's system. Please, note that there is a different status for expired tokens. */
  RS_ERROR_INVALID_TOKEN: 'RS_ERROR_INVALID_TOKEN',
  /** Unknown game_code. NOTE: in case of game providers with game lobby (Live Dealers), user can switch games within one game session. We track such changes and send game_code of the game which the user is actually playing at the moment. Note that game_code may change within one game session. */
  RS_ERROR_INVALID_GAME: 'RS_ERROR_INVALID_GAME',
  /** Transaction currency differs from User's wallet currency. */
  RS_ERROR_WRONG_CURRENCY: 'RS_ERROR_WRONG_CURRENCY',
  /** Not enough money on User's balance to place a bet. Please send the actual balance together with this status. */
  RS_ERROR_NOT_ENOUGH_MONEY: 'RS_ERROR_NOT_ENOUGH_MONEY',
  /** User is disabled/locked and can't place bets. */
  RS_ERROR_USER_DISABLED: 'RS_ERROR_USER_DISABLED',
  /** Operator couldn't verify signature on request from Hub88. */
  RS_ERROR_INVALID_SIGNATURE: 'RS_ERROR_INVALID_SIGNATURE',
  /** Session with specified token has already expired. NOTE: token validity MUST NOT be validated in case of wins and rollbacks, since they might come long after the bets. */
  RS_ERROR_TOKEN_EXPIRED: 'RS_ERROR_TOKEN_EXPIRED',
  /** Received request doesn't match expected request form and syntax. */
  RS_ERROR_WRONG_SYNTAX: 'RS_ERROR_WRONG_SYNTAX',
  /** Type of parameters in request doesn't match expected types. */
  RS_ERROR_WRONG_TYPES: 'RS_ERROR_WRONG_TYPES',
  /** A transaction with same transaction_uuid was sent, but there was a different reference transactionID, amount, currency, round, user or game. */
  RS_ERROR_DUPLICATE_TRANSACTION: 'RS_ERROR_DUPLICATE_TRANSACTION',
  /** Returned when the bet referenced in win request can't be found on Operator's side (wasn't processed or was rolled back). If you received rollback request and can't find the transaction to roll back, respond RS_OK */
  RS_ERROR_TRANSACTION_DOES_NOT_EXIST: 'RS_ERROR_TRANSACTION_DOES_NOT_EXIST',
} as const
