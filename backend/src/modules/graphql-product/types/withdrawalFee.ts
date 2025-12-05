import { objectType } from 'nexus'

export const WithdrawalFeeType = objectType({
  name: 'WithdrawalFee',
  definition: type => {
    type.nonNull.id('id')
    type.nonNull.float('fee')
  },
})
