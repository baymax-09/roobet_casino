import { Transaction } from 'web3-core'

import { BlockioTransaction } from 'src/vendors/blockio/types'
import { Deposit } from 'src/modules/deposit/types'

/** This mock data should not be used to make real transactions on a testnet */
export const bitcoinTransactionMock: BlockioTransaction = {
  network: 'BTC',
  address: 'bc1q7whyx9kantmg360v46mxmvv73nn9eqpvxtzkvj0aluj2hcce064q4l4d73',
  balance_change: '0.01000000',
  amount_sent: '0.00000000',
  amount_received: '0.01000000',
  txid: 'cae20be02db2802c8e2bdec123ad4136322d50ad1f3a57e8dcb5dfd5574f8cfb',
  confirmations: 0,
  is_green: false,
}

export const litecoinTransactionMock: BlockioTransaction = {
  network: 'LTC',
  address: 'M8hBfG3p2KFoVnSvYqYzKiaL8xLcHzLUyS',
  balance_change: '0.01000000',
  amount_sent: '0.00000000',
  amount_received: '0.01000000',
  txid: '92d7c7ae39a625d06a0f13ca4c8235da7fb272742a282c5c647ccfcf92d94804',
  confirmations: 0,
  is_green: false,
}

export const ethereumTransactionMock: Transaction = {
  hash: '0x19d6687baddba21e2e563f8634a80aa376792a1ff2cad91acb6bd774a7cd6d9e',
  nonce: 1445895,
  blockHash: '0xdd9643c0e56b5332657bd887afc1c08de1f8fc067023638c8c519eb7e096c8cd',
  blockNumber: 10007857,
  transactionIndex: 0,
  from: '0xa7a82dd06901f29ab14af63faf3358ad101724a8',
  to: '0xac4915a05b6edb7e3313686634503ebff8b8854d',
  value: '100000000000000000',
  gasPrice: '2500000010',
  gas: 6000,
  input: '0x',
}

export const depositMock: Deposit = {
  id: '123',
  amount: 100,
  status: 'initiated',
  userId: 'testid',
  depositType: 'ethereum',
  currency: 'usd',
  externalId: '0x19d6687baddba21e2e563f8634a80aa376792a1ff2cad91acb6bd774a7cd6d9e',
  tracked: false,
  meta: {},
  secrets: {},
}
