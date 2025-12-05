export interface IUserWallet {
  id: string
  userId: string
  address: string
  type: string // TODO use coalesced crypto type

  nonce?: number
  imported?: boolean
  destinationTag?: number

  /** @deprecated no longer used for pooling */
  hasBalance: boolean
  /** @deprecated no longer used with the deprecation of our BTC nodes. */
  nodeId?: string
}
