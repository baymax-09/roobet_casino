import {
  MOCK_AUTHORIZE_WITHDRAWAL_REQUEST as MOCK_AUTHORIZE_REQUEST,
  MOCK_CANCEL_REQUEST,
  MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT,
  MOCK_TRANSFER_REQUEST,
  MOCK_USER,
} from '../test/mocks'
import {
  cancelCashWithdrawal,
  completeCashWithdrawal,
  startCashWithdrawal,
} from './cashWithdrawal'
import * as userDocument from '../../../modules/user/documents/user'
import * as balance from '../../../modules/user/balance/lib'
import * as KYC from '../../../modules/fraud/kyc'
import * as withdrawalModule from '../../../modules/withdraw/lib/risk'
import * as withdrawValidation from '../../../modules/withdraw/lib/validate'
import * as withdrawalModuleHooks from '../../../modules/withdraw/lib/hooks'
import * as userSettingsModule from '../../../modules/userSettings'
import * as riskAssessment from '../../../modules/fraud/riskAssessment'
import * as cashWithdrawalTransactions from '../documents/cash_withdrawal_transactions'
import { errorMap } from '../constants'

describe('paymentiq/lib/cashWithdrawal.ts', () => {
  beforeEach(() => {
    jest.spyOn(userDocument, 'getUserById').mockResolvedValue(MOCK_USER)
    jest.spyOn(KYC, 'getKycForUser').mockResolvedValue({})
    // @ts-expect-error-next-line
    jest.spyOn(balance, 'creditBalance').mockResolvedValue(null)

    // @ts-expect-error-next-line
    jest.spyOn(balance, 'deductFromBalance').mockResolvedValue(null)

    // @ts-expect-error-next-line
    jest
      .spyOn(userSettingsModule, 'changeSystemEnabledUser')
      .mockResolvedValue(null)
    jest.spyOn(userSettingsModule, 'checkSystemEnabled').mockResolvedValue(true)

    jest
      .spyOn(cashWithdrawalTransactions, 'createCashWithdrawalTransaction')
      .mockResolvedValue(MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT)
    jest
      .spyOn(cashWithdrawalTransactions, 'updateCashWithdrawalTransaction')
      .mockResolvedValue(MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT)
    jest
      .spyOn(
        cashWithdrawalTransactions,
        'updateCashWithdrawalTransactionByExternalId',
      )
      .mockResolvedValue(MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT)

    jest.spyOn(withdrawalModule, 'checkForRisk').mockResolvedValue({
      isDeclined: false,
    })
    jest
      .spyOn(withdrawValidation, 'validateWithdrawalForCash')
      .mockResolvedValue(true)

    jest.spyOn(withdrawalModuleHooks, 'notifyOnUpdate').mockResolvedValue()

    jest.spyOn(userDocument, 'updateTotalWithdrawn').mockResolvedValue()
    jest.spyOn(userDocument, 'decrementMaxWithdraw').mockResolvedValue()

    jest.spyOn(riskAssessment, 'feedbackForCashTransaction').mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('startCashWithdrawal', () => {
    it('should return an unsuccessful response if a user is not found', async () => {
      jest.spyOn(userDocument, 'getUserById').mockResolvedValue(null)

      const response = await startCashWithdrawal({
        ...MOCK_AUTHORIZE_REQUEST,
        userId: 'USER_NOT_FOUND',
      })

      expect(response.userId).toBe('USER_NOT_FOUND')
      expect(response.errCode).toBe(errorMap.WITHDRAWAL_USER_NOT_FOUND.errCode)
    })

    it('should return an unsuccessful response if a user does not have two factor authentication', async () => {
      jest.spyOn(userDocument, 'getUserById').mockResolvedValue({
        ...MOCK_USER,
        twofactorEnabled: false,
      })

      const response = await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(response.errCode).toBe(
        errorMap.WITHDRAWAL_TWO_FACTOR_DISABLED.errCode,
      )
    })

    it('should Validate User', async () => {
      // @ts-expect-error-next-line
      jest
        .spyOn(userSettingsModule, 'checkSystemEnabled')
        .mockResolvedValue(null)

      const response = await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(userSettingsModule.checkSystemEnabled).toHaveBeenCalled()

      expect(response.userId).toBe(MOCK_AUTHORIZE_REQUEST.userId)
      expect(response.errCode).toBe(
        errorMap.WITHDRAWAL_USER_SYSTEM_DISABLED.errCode,
      )
    })

    it('should Create a WithdrawalTransaction record with a status of initiated', async () => {
      await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(
        cashWithdrawalTransactions.createCashWithdrawalTransaction,
      ).toHaveBeenCalledWith({
        amount: 100.5,
        currency: 'usd',
        externalId: '12345',
        originTxId: '',
        paymentMethod: 'CreditcardWithdrawal',
        provider: 'SafeCharge',
        reason: '',
        status: 'initiated',
        userId: MOCK_USER.id,
      })
    })

    it('should Run Risk Checks and send error if failed', async () => {
      jest.spyOn(withdrawalModule, 'checkForRisk').mockResolvedValue({
        isDeclined: true,
        reason: 'RISK_CHECK',
      })

      const response = await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(response.errCode).toBe(
        errorMap.WITHDRAWAL_RISK_CHECK_FAILED.errCode,
      )
    })

    it('should take balance from user', async () => {
      await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(balance.deductFromBalance).toHaveBeenCalled()
    })

    it('should return an error if take balance from user fails', async () => {
      jest
        .spyOn(balance, 'deductFromBalance')
        .mockRejectedValue(new Error('failure'))
      const response = await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(response.errCode).toBe(
        errorMap.UNEXPECTED_WITHDRAWAL_ERROR.errCode,
      )
    })

    it('should Update a WithdrawalTransaction record with a status of pending', async () => {
      await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(
        cashWithdrawalTransactions.updateCashWithdrawalTransaction,
      ).toHaveBeenCalledWith(
        MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT._id.toString(),
        { status: 'pending' },
      )
    })

    it('should return an Authorize interface on success', async () => {
      const response = await startCashWithdrawal(MOCK_AUTHORIZE_REQUEST)

      expect(response.success).toBe(true)
      expect(response.userId).toBe(MOCK_USER.id)
    })
  })

  describe('completeCashWithdrawal', () => {
    it('should return an unsuccessful response if a user is not found', async () => {
      jest.spyOn(userDocument, 'getUserById').mockResolvedValue(null)

      const response = await completeCashWithdrawal({
        ...MOCK_TRANSFER_REQUEST,
        userId: 'USER_NOT_FOUND',
      })

      expect(response.userId).toBe('USER_NOT_FOUND')
      expect(response.errCode).toBe(errorMap.WITHDRAWAL_USER_NOT_FOUND.errCode)
    })

    it('should Update a WithdrawalTransaction record with a status of completed', async () => {
      await completeCashWithdrawal(MOCK_TRANSFER_REQUEST)

      expect(
        cashWithdrawalTransactions.updateCashWithdrawalTransactionByExternalId,
      ).toHaveBeenCalledWith(MOCK_TRANSFER_REQUEST.txId, {
        status: 'completed',
        providerResponse: { pspStatusMessage: 'Success', info: '' },
      })
    })
  })

  describe('cancelCashWithdrawal', () => {
    it('should Update a WithdrawalTransaction record with a status of Declined', async () => {
      await cancelCashWithdrawal(MOCK_CANCEL_REQUEST)

      expect(
        cashWithdrawalTransactions.updateCashWithdrawalTransactionByExternalId,
      ).toHaveBeenCalledWith(MOCK_CANCEL_REQUEST.txId, {
        status: 'declined',
        reason: '1111',
        providerResponse: {
          statusCode: '1111',
          pspStatusCode: '123',
          pspStatusMessage: 'Success',
          info: '',
        },
      })
    })
  })
})
