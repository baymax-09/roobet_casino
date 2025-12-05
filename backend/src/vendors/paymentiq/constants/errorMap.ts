/**
 * Map of Error Codes + Response Messages
 *
 * Error Code Legend:
 * 10000 - Unknown and Technical Errors.
 * 20000 - Validation Errors.
 * 30000 - Risk Check Errors.
 *
 * X1000 - Deposit Errors
 * X2000 - Withdrawal Errors
 */

export interface ErrorMapItem {
  errCode: string
  errMsg: string
}

export const errorMap = {
  // 10000
  UNKNOWN_ERROR: {
    errCode: '10000',
    errMsg: 'An unexpected error occured',
  },
  ACTION_DISABLED: {
    errCode: '10001',
    errMsg: 'This action is currently disabled',
  },

  // 12000
  UNEXPECTED_WITHDRAWAL_ERROR: {
    errCode: '12000',
    errMsg: 'An unexpected error occurred when taking a users balance',
  },

  // 20000
  UNEXPECTED_TRANSACTION_TYPE: {
    errCode: '20000',
    errMsg: 'An unexpected transaction type was provided',
  },
  USER_NOT_FOUND: {
    errCode: '20001',
    errMsg: 'User not found',
  },
  USER_KYC_LEVEL_NOT_ALLOWED: {
    errCode: '20002',
    errMsg: 'User KYC level greater than or equal to 1 required',
  },
  USER_SESSION_INVALID: {
    errCode: '20003',
    errMsg: 'User session is invalid',
  },
  USER_KYC_POSTAL_CODE_MISSING: {
    errCode: '20004',
    errMsg: 'User KYC data missing postal code',
  },
  USER_KYC_PHONE_MISSING: {
    errCode: '20005',
    errMsg: 'User KYC data missing phone number',
  },
  USER_KYC_DOB_MISSING: {
    errCode: '20006',
    errMsg: 'User KYC data missing date of birth',
  },

  // 21000
  DEPOSIT_USER_NOT_FOUND: {
    errCode: '21000',
    errMsg: 'User not found for deposit',
  },
  DEPOSIT_USER_SYSTEM_DISABLED: {
    errCode: '21001',
    errMsg: 'System disabled for user in deposit',
  },
  DEPOSIT_TRANSACTION_NOT_FOUND: {
    errCode: '21002',
    errMsg: 'Deposit Transaction not found',
  },
  DEPOSIT_STATUS_ALREADY_COMPLETED: {
    errCode: '21003',
    errMsg: 'Deposit status is already completed',
  },

  // 22000
  WITHDRAWAL_USER_NOT_FOUND: {
    errCode: '22000',
    errMsg: 'User not found for withdrawal',
  },
  WITHDRAWAL_USER_SYSTEM_DISABLED: {
    errCode: '22001',
    errMsg: 'System disabled for user in withdrawal',
  },
  WITHDRAWAL_TRANSACTION_NOT_FOUND: {
    errCode: '22002',
    errMsg: 'Withdrawal Transaction not found',
  },
  WITHDRAWAL_STATUS_ALREADY_COMPLETED: {
    errCode: '22003',
    errMsg: 'Withdrawal status is already completed',
  },
  WITHDRAWAL_TWO_FACTOR_DISABLED: {
    errCode: '22004',
    errMsg: 'User does not have two factor enabled in withdrawal',
  },
  WITHDRAWAL_VERIFY_EMAIL: {
    errCode: '22005',
    errMsg: "User hasn't verified email",
  },
  WITHDRAWAL_MAX_WITHDRAW: {
    errCode: '22006',
    errMsg: 'User has reached the max withdraw amount',
  },
  WITHDRAWAL_DAILY_ALLOWANCE: {
    errCode: '22007',
    errMsg: 'User has reached daily withdraw allowance',
  },
  WITHDRAWAL_MATCH_PROMO: {
    errCode: '22008',
    errMsg: 'User has existing incomplete match promo',
  },
  WITHDRAWAL_INSUFFICIENT_FUNDS: {
    errCode: '22009',
    errMsg: 'User has does not have a enough balance to withdraw',
  },
  WITHDRAWAL_DEPOSIT_WAGER_REQUIREMENT: {
    errCode: '22010',
    errMsg: 'User has not met the required deposit value to withdraw',
  },
  // Not sure we need this one but putting it here anyway as it is in code...
  WITHDRAWAL_HOWIE_DEAL_EXCEED: {
    errCode: '22011',
    errMsg: 'User has exceeded their howie deal',
  },

  // 30000
  // 31000
  DEPOSIT_RISK_CHECK_FAILED: {
    errCode: '31000',
    errMsg: 'Risk check failed for deposit',
  },

  // 32000
  WITHDRAWAL_RISK_CHECK_FAILED: {
    errCode: '32000',
    errMsg: 'Risk check failed for withdrawal',
  },
}
