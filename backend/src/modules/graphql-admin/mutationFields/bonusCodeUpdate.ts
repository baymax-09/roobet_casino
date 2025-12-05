import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { updateBonusCode } from 'src/modules/crm/documents/bonusCode'

const BonusCodeUpdateInput = inputObjectType({
  name: 'BonusCodeUpdateInput',
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      description: 'The id of the bonus code.',
    })
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

export const BonusCodeUpdateMutationField = mutationField('bonusCodeUpdate', {
  description: 'Update a bonus code.',
  type: nonNull('BonusCode'),
  args: { data: nonNull(BonusCodeUpdateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'crm', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    try {
      const { id, ...payload } = data
      return await updateBonusCode(id, payload)
    } catch (error) {
      throw new GraphQLError(error)
    }
  },
})
