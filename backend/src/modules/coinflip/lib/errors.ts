export const ErrorMap = {
  MISSING_ID: {
    code: 101,
    message: 'Missing ID',
  },
  MISSING_ACTION: {
    code: 102,
    message: 'Action failed to save',
  },
  MISSING_COMPETITOR: {
    code: 103,
    message:
      'Missing competitor info during validation and competitor is not a bot',
  },
  MISSING_BLOCKHASH: {
    code: 106,
    message: 'BlockHash Unavailable',
  },
  MISSING_COMPETITOR_CLOSEOUT: {
    code: 107,
    message:
      'Missing competitor info during closeout and competitor is not a bot',
  },
  MISSING_OUTCOME: {
    code: 108,
    message: 'Game is missing an outcome at the time of closeout',
  },
  MISSING_COMPETITOR_ROUND: {
    code: 109,
    message: 'Cannot calculate game result without competitorRoundId',
  },
  MISSING_COMPETITOR_NONCE: {
    code: 110,
    message: 'Cannot calculate game result without competitorNonce',
  },
  MISSING_BLOCKHASH_ATTEMPT_LIMIT: {
    code: 111,
    message: 'Attempt limit reached - BlockHash Unavailable',
  },

  DUPLICATE_ACTION: {
    code: 201,
    message: 'Action already exists',
  },

  INVALID_STATE: {
    code: 301,
    message: 'Invalid state. Game should have a status of STARTED',
  },

  UNKNOWN_ERROR: {
    code: 1000,
    message: 'Unknown error occurred',
  },
  UNKNOWN_CLOSEOUT_ERROR: {
    code: 1001,
    message: 'Unknown error during closeout',
  },
}
