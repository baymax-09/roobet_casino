import {
  MOCK_AUTHORIZE_DEPOSIT_REQUEST as MOCK_AUTHORIZE_REQUEST,
  MOCK_CANCEL_REQUEST,
  MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT,
  MOCK_TRANSFER_REQUEST,
  MOCK_USER,
} from '../test/mocks'
import {
  cancelCashDeposit,
  completeCashDeposit,
  startCashDeposit,
} from './cashDeposit'
import * as userDocument from '../../../modules/user/documents/user'
import * as KYC from '../../../modules/fraud/kyc'
import * as depositModule from '../../../modules/deposit'
import * as depositModuleHooks from '../../../modules/deposit/lib/hooks'
import * as userSettingsModule from '../../../modules/userSettings'
import * as riskAssessment from '../../../modules/fraud/riskAssessment'
import * as cashDepositTransactions from '../documents/cash_deposit_transactions'
import { errorMap } from '../constants'

import { DepositStatuses } from '../../../modules/deposit'

describe('paymentiq/lib/cashDeposit.ts', () => {
  beforeEach(() => {
    jest.spyOn(userDocument, 'getUserById').mockResolvedValue(MOCK_USER)
    jest.spyOn(userDocument, 'creditUserId').mockResolvedValue('')
    jest.spyOn(KYC, 'getKycForUser').mockResolvedValue({})

    // @ts-expect-error-next-line
    jest
      .spyOn(userSettingsModule, 'changeSystemEnabledUser')
      .mockResolvedValue(null)
    jest.spyOn(userSettingsModule, 'checkSystemEnabled').mockResolvedValue(true)

    jest
      .spyOn(cashDepositTransactions, 'createCashDepositTransaction')
      .mockResolvedValue(MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT)
    jest
      .spyOn(cashDepositTransactions, 'updateCashDepositTransaction')
      .mockResolvedValue(MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT)
    jest
      .spyOn(cashDepositTransactions, 'getCashDepositTransactionByExternalId')
      .mockResolvedValue(MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT)
    jest
      .spyOn(
        cashDepositTransactions,
        'updateCashDepositTransactionByExternalId',
      )
      .mockResolvedValue(MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT)

    jest.spyOn(depositModule, 'riskCheck').mockResolvedValue()

    jest.spyOn(depositModuleHooks, 'notifyOnUpdate').mockResolvedValue()
    jest.spyOn(depositModuleHooks, 'afterDepositHooks').mockResolvedValue()

    jest.spyOn(riskAssessment, 'feedbackForCashTransaction').mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('startCashDeposit', () => {
    it('should return an unsuccessful response if a user is not found', async () => {
      jest.spyOn(userDocument, 'getUserById').mockResolvedValue(null)

      const response = await startCashDeposit({
        ...MOCK_AUTHORIZE_REQUEST,
        userId: 'USER_NOT_FOUND',
      })

      expect(response.userId).toBe('USER_NOT_FOUND')
      expect(response.errCode).toBe(errorMap.DEPOSIT_USER_NOT_FOUND.errCode)
    })

    it('should Validate User', async () => {
      // @ts-expect-error-next-line
      jest
        .spyOn(userSettingsModule, 'checkSystemEnabled')
        .mockResolvedValue(null)

      const response = await startCashDeposit(MOCK_AUTHORIZE_REQUEST)

      expect(userSettingsModule.checkSystemEnabled).toHaveBeenCalled()

      expect(response.userId).toBe(MOCK_AUTHORIZE_REQUEST.userId)
      expect(response.errCode).toBe(
        errorMap.DEPOSIT_USER_SYSTEM_DISABLED.errCode,
      )
    })

    it('should Create a DepositTransaction record with a status of initiated', async () => {
      await startCashDeposit(MOCK_AUTHORIZE_REQUEST)

      expect(
        cashDepositTransactions.createCashDepositTransaction,
      ).toHaveBeenCalledWith({
        amount: 100.5,
        currency: 'usd',
        externalId: '12345',
        originTxId: '',
        paymentMethod: 'CreditcardDeposit',
        provider: 'SafeCharge',
        reason: '',
        status: 'initiated',
        userId: MOCK_USER.id,
      })
    })

    it('should Run Risk Checks and send error if failed', async () => {
      jest.spyOn(depositModule, 'riskCheck').mockRejectedValue('')

      const response = await startCashDeposit(MOCK_AUTHORIZE_REQUEST)

      expect(response.errCode).toBe(errorMap.DEPOSIT_RISK_CHECK_FAILED.errCode)
    })

    it('should Update a DepositTransaction record with a status of pending', async () => {
      await startCashDeposit(MOCK_AUTHORIZE_REQUEST)

      expect(
        cashDepositTransactions.updateCashDepositTransaction,
      ).toHaveBeenCalledWith(
        MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT._id.toString(),
        { status: 'pending' },
      )
    })

    it('should return an Authorize interface on success', async () => {
      const response = await startCashDeposit(MOCK_AUTHORIZE_REQUEST)

      expect(response.success).toBe(true)
      expect(response.userId).toBe(MOCK_USER.id)
    })
  })

  describe('completeCashDeposit', () => {
    it('should return an unsuccessful response if a user is not found', async () => {
      jest.spyOn(userDocument, 'getUserById').mockResolvedValue(null)

      const response = await completeCashDeposit({
        ...MOCK_TRANSFER_REQUEST,
        userId: 'USER_NOT_FOUND',
      })

      expect(response.userId).toBe('USER_NOT_FOUND')
      expect(response.errCode).toBe(errorMap.DEPOSIT_USER_NOT_FOUND.errCode)
    })

    it('should return an unsuccessful response if a deposit is not found', async () => {
      jest
        .spyOn(cashDepositTransactions, 'getCashDepositTransactionByExternalId')
        .mockResolvedValue(null)

      const response = await completeCashDeposit(MOCK_TRANSFER_REQUEST)

      expect(response.errCode).toBe(
        errorMap.DEPOSIT_TRANSACTION_NOT_FOUND.errCode,
      )
    })

    it('should return an unsuccessful response if a deposit is already complete', async () => {
      jest
        .spyOn(cashDepositTransactions, 'getCashDepositTransactionByExternalId')
        .mockResolvedValue({
          ...MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT,
          status: DepositStatuses.Completed,
        })

      const response = await completeCashDeposit(MOCK_TRANSFER_REQUEST)

      expect(response.errCode).toBe(
        errorMap.DEPOSIT_STATUS_ALREADY_COMPLETED.errCode,
      )
    })

    it('should Update a DepositTransaction record with a status of completed', async () => {
      await completeCashDeposit(MOCK_TRANSFER_REQUEST)

      expect(
        cashDepositTransactions.updateCashDepositTransaction,
      ).toHaveBeenCalledWith(
        MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT._id.toString(),
        {
          status: 'completed',
          providerResponse: { pspStatusMessage: 'Success', info: '' },
        },
      )
    })

    it('should credit a user', async () => {
      await completeCashDeposit(MOCK_TRANSFER_REQUEST)

      expect(userDocument.creditUserId).toHaveBeenCalledWith(
        MOCK_USER.id,
        100,
        'deposit',
        { depositId: MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT._id.toString() },
        'cash',
        undefined,
      )
    })
  })

  describe('cancelCashDeposit', () => {
    it('should Update a DepositTransaction record with a status of Declined', async () => {
      await cancelCashDeposit(MOCK_CANCEL_REQUEST)

      expect(
        cashDepositTransactions.updateCashDepositTransactionByExternalId,
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
