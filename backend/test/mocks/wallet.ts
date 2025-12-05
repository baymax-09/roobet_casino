import { type IUserWallet } from 'src/modules/crypto/types'

export const userWalletEthereumMock: IUserWallet = {
  id: 1,
  userId: 'testid',
  address: '0xac4915a05b6edb7e3313686634503ebff8b8854d',
  hasBalance: true,
  type: 'Ethereum',
  imported: false,
  nodeId: null,
}
