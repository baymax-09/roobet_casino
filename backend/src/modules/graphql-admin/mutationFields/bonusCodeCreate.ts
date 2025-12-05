import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { createBonusCode } from 'src/modules/crm/documents/bonusCode'

const BonusCodeCreateInput = inputObjectType({
  name: 'BonusCodeCreateInput',
  definition(type) {
    type.nonNull.nonEmptyString('name', {
      auth: null,
      description: 'The name of the bonus code.',
    })
    type.nonNull.nonEmptyString('description', {
      auth: null,
      description: 'The descriptions associated with the bonus code',
    })
    type.nonNull.field('type', {
      auth: null,
      description: 'The type of bonus code.',
      type: 'BonusCodeType',
    })
    type.nonNull.field('typeSettings', {
      auth: null,
      description: 'The type of bonus code.',
      type: 'BonusCodeTypeSettingsInput',
    })
  },
})

export const BonusCodeCreateMutationField = mutationField('bonusCodeCreate', {
  description: 'Create a bonus code.',
  type: nonNull('BonusCode'),
  args: { data: nonNull(BonusCodeCreateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'crm', action: 'create' }],
  },
  resolve: async (_, { data }) => {
    try {
      return await createBonusCode(data)
    } catch (error) {
      throw new GraphQLError(error)
    }
  },
})
