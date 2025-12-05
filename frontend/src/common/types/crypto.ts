export interface RippleDepositInfo {
  id: string
  destinationTag: number
  destinationAddress: string
  type: 'ripple'
}

export interface TronUserWalletInfo {
  id: string
  nonce: number
  address: string
  type: 'tron'
  userId: string
}
