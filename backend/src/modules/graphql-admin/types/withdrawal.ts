import { GraphQLError } from 'graphql'
import { objectType, nonNull } from 'nexus'

import { getUserById } from 'src/modules/user'

export const WithdrawalType = objectType({
  name: 'Withdrawal',
  sourceType: {
    module: __dirname,
    export: 'DBWithdrawal',
  },
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
      description: 'The unique identifier of this withdrawal.',
      resolve: ({ id, _id }) => _id.toString() ?? id,
    })

    type.nonNull.string('plugin', {
      auth: null,
      description: 'The withdrawal plugin (e.g., crypto).',
    })
    type.nonNull.string('userId', {
      auth: null,
      description: 'The id of the user who initiated the withdrawal.',
    })
    type.nonNull.string('currency', {
      auth: null,
      description: 'The currency on the withdrawal.',
    })
    type.nonNull.string('status', {
      auth: null,
      description: 'The status of the withdrawal.',
    })
    type.nonNull.string('timestamp', {
      auth: null,
      description: 'The timestamp of the withdrawal.',
    })
    type.nonNull.string('transactionId', {
      auth: null,
      description: 'The exterior transaction id of the withdrawal.',
    })
    type.string('reason', {
      auth: null,
      description: 'The reason behind the withdrawal being flagged.',
    })

    type.nonNull.int('attempts', {
      auth: null,
      description: 'The number of withdrawal attempts.',
    })

    type.nonNull.float('totalValue', {
      auth: null,
      description: 'The total value of the withdrawal.',
    })

    type.nonNull.field('user', {
      auth: null,
      description: 'The user associated with the withdrawal.',
      type: nonNull('User'),
      resolve: async ({ userId }) => {
        const user = await getUserById(userId)
        if (!user) {
          throw new GraphQLError('Cannot find user.')
        }
        return user
      },
    })

    type.date('createdAt', {
      auth: null,
      description: 'The date the withdrawal was created.',
    })
    type.date('updatedAt', {
      auth: null,
      description: 'The date the withdrawal was last updated.',
    })
  },
})
