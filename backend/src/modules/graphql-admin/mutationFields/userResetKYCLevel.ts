import { mutationField, inputObjectType, nonNull } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  getForUserId,
  resetKYCLevel,
} from 'src/modules/fraud/kyc/documents/kyc'

const UserResetKYCLevelInput = inputObjectType({
  name: 'ResetKYCLevelInput',
  definition(type) {
    type.nonNull.int('level', {
      auth: null,
      description: 'The KYC level to be reset for the user.',
    })
    type.nonNull.uuid('userId', {
      auth: null,
      description: 'The user ID to reset the KYC level for.',
    })
  },
})

export const UserResetKYCLevelMutationField = mutationField('resetKYCLevel', {
  description: 'Removes a KYC level from a user.',
  type: 'KYCRecord',
  args: {
    data: nonNull(UserResetKYCLevelInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'kyc', action: 'update' }],
  },
  resolve: async (_, { data }, { user }) => {
    if (!user) {
      throw new GraphQLError('Cannot reset KYC level.', {})
    }
    const userId = data.userId
    // Get KYC level by user id
    const { kyc } = await getForUserId(userId)

    if (!kyc?.validationResults) {
      throw new GraphQLError(
        'Cannot reset KYC level. User does not have validation results.',
        {},
      )
    }
    if (data.level === 0 || data.level > kyc?.validationResults.length) {
      throw new GraphQLError('Invalid KYC level provided.', {})
    }
    return await resetKYCLevel(kyc, data.level, user.id)
  },
})
