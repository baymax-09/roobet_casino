import { Types } from 'mongoose'
import { DepositStatuses } from 'src/modules/deposit'
import { WithdrawStatusEnum } from 'src/modules/withdraw/types'
import {
  type CancelRequest,
  type TransferRequest,
  type VerifyUserRequest,
  type AuthorizeRequest,
  type ProviderResponse,
} from '../types'

export const MOCK_USER = {
  id: 'user_123',
  countryCode: 'CA',
  createdAt: new Date().toISOString(),
  email: 'test@test.com',
  lastLogin: new Date().toISOString(),
  name: 'Test McTesterson',
  nameLowercase: 'test mctesterson',
  twofactorEnabled: true,
  balances: {
    selectedBalanceType: 'crypto',
    eth: 0.0,
    crypto: 100.0,
    ltc: 0.0,
    cash: 100.0,
    usdt: 100.0,
    usdc: 100.0,
    xrp: 100.0,
  },
}

const MOCK_TRANSFER_PROVIDER_RESPONSE: ProviderResponse = {
  statusCode: '1111',
  pspStatusMessage: 'Success',
  info: '',
}

const MOCK_CANCEL_PROVIDER_RESPONSE: ProviderResponse = {
  statusCode: '1111',
  pspStatusCode: '123',
  pspStatusMessage: 'Success',
  info: '',
}

export const MOCK_VERIFY_USER_REQUEST: VerifyUserRequest = {
  sessionId: '123',
  userId: MOCK_USER.id,
}

const MOCK_AUTHORIZE_REQUEST: Omit<AuthorizeRequest, 'txName'> = {
  userId: MOCK_USER.id,
  txAmount: '100.50',
  txAmountCy: 'usd',
  txId: '12345',
  txTypeId: '108',
  provider: 'SafeCharge',
}

export const MOCK_AUTHORIZE_DEPOSIT_REQUEST: AuthorizeRequest = {
  ...MOCK_AUTHORIZE_REQUEST,
  txName: 'CreditcardDeposit',
}

export const MOCK_AUTHORIZE_WITHDRAWAL_REQUEST: AuthorizeRequest = {
  ...MOCK_AUTHORIZE_REQUEST,
  txName: 'CreditcardWithdrawal',
}

export const MOCK_TRANSFER_REQUEST: TransferRequest = {
  userId: MOCK_USER.id,
  txAmount: '100.50',
  txAmountCy: 'usd',
  txPspAmount: '12.50',
  txPspAmountCy: 'EUR',
  fee: '0.50',
  feeCy: 'SEK',
  txId: '25A0324',
  txTypeId: '101',
  txName: 'CreditcardDeposit',
  provider: 'SafeCharge',
  txRefId: '100019999A26720',
  pspStatusMessage: 'Success',
}

export const MOCK_CANCEL_REQUEST: CancelRequest = {
  userId: MOCK_USER.id,
  authCode: '1238712937821',
  txAmount: '100.50',
  txAmountCy: 'SEK',
  txId: '25A0324',
  txTypeId: '101',
  txName: 'CreditcardDeposit',
  provider: 'SafeCharge',
  statusCode: '1111',
  pspStatusCode: '123',
  pspStatusMessage: 'Success',
}

export const MOCK_CASH_DEPOSIT_TRANSACTION_DOCUMENT = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  userId: MOCK_USER.id,
  provider: 'SafeCharge',
  paymentMethod: 'CreditcardDeposit',
  amount: 100.0,
  currency: 'usd',
  externalId: '12345',
  status: DepositStatuses.Initiated,
  reason: '',
  originTxId: '',
  providerResponse: MOCK_CANCEL_PROVIDER_RESPONSE,
}

export const MOCK_CASH_WITHDRAWAL_TRANSACTION_DOCUMENT = {
  id: '1',
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  userId: MOCK_USER.id,
  provider: 'SafeCharge',
  paymentMethod: 'CreditcardWithdrawal',
  amount: 100.0,
  currency: 'usd',
  externalId: '12345',
  status: WithdrawStatusEnum.INITIATED,
  reason: '',
  originTxId: '',
  providerResponse: MOCK_TRANSFER_PROVIDER_RESPONSE,
}
