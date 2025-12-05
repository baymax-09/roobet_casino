import { GraphQLError } from 'graphql'
import { mutationField, nonNull, inputObjectType } from 'nexus'

import { updateBlockioTransaction } from 'src/vendors/blockio'

const BlockioTransactionUpdateInput = inputObjectType({
  name: 'BlockioUpdateTransactionInput',
  definition(type) {
    type.nonNull.nonEmptyString('transactionId', {
      auth: null,
      description: 'transaction id to be updated.',
    })
    type.nonNull.nonEmptyString('crypto', {
      auth: null,
      description: 'cryptocurrency type.',
    })
    type.nonNull.boolean('forcedReprocess', {
      auth: null,
      description: 'force reprocess.',
    })
  },
})

export const BlockioTransactionUpdateMutationField = mutationField(
  'blockioUpdateTransaction',
  {
    description: 'Update Blockio Transaction.',
    type: 'Success',
    args: { data: nonNull(BlockioTransactionUpdateInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'deposits', action: 'update' }],
    },
    resolve: async (_, args, { user }) => {
      try {
        if (!user) {
          return { success: false, error: 'Permission Denied' }
        }
        return await updateBlockioTransaction(args.data, user)
      } catch {
        throw new GraphQLError('Unable to get current blockio dogecoin block')
      }
    },
  },
)
