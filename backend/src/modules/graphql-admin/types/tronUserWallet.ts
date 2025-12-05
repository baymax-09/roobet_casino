import { objectType } from 'nexus'

export const TronUserWalletType = objectType({
  name: 'TronUserWallet',
  description: 'Tron Wallet for User',
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
    })
    type.nonNull.string('address', {
      auth: null,
    })
    type.nonNull.int('nonce', {
      auth: null,
    })
    type.nonNull.string('userId', {
      auth: null,
    })
    type.nonNull.string('type', {
      auth: null,
    })
  },
})
