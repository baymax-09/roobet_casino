/**
 * Used for error handling.
 * List of ReasonCodes that can be appended to a Withdrawal Transaction
 * record, if that transaction does not reach Completed status.
 */
export const FailureReasonCodes = {
  SEON_CHECK: {
    message: 'Withdraw Declined via Seon Fraud Check.',
  },
  CHAINALYSIS_CHECK: {
    message: 'Withdrawal Declined via Chainalysis - Risky Withdraw detected',
  },
  DEDUCT_BALANCE: {
    message: 'Failed to deduct balance',
  },
  PLUGIN_UNKNOWN_FAILURE: {
    message: 'Failed plugin send and status update',
  },
  RISK_CHECK: {
    message: 'Withdrawal Declined Risk Check - Risky Withdraw detected',
  },
  TRANSACTION_FAILED: {
    message: 'Withdrawal Declined - Failed to create a transaction record',
  },
  ACCOUNT_LOCKED: {
    message: 'User account is locked.',
  },
} as const

export function checkFeePaidByUser(fee: number): number {
  const minThresholdUSD = 0.01

  if (fee < minThresholdUSD) {
    return 0
  } else {
    return fee
  }
}
