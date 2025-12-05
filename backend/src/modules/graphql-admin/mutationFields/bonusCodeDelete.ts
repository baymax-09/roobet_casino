import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  getBonusCodeById,
  deleteBonusCode,
} from 'src/modules/crm/documents/bonusCode'

const BonusCodeDeleteInput = inputObjectType({
  name: 'BonusCodeDeleteInput',
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      description: 'The id of the bonus code to delete.',
    })
  },
})

export const BonusCodeDeleteMutationField = mutationField('bonusCodeDelete', {
  description: 'Delete a bonus code.',
  type: 'BonusCode',
  args: { data: nonNull(BonusCodeDeleteInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'crm', action: 'delete' }],
  },
  resolve: async (_, { data }) => {
    const { id } = data
    try {
      const bonusCode = await getBonusCodeById(id)
      if (!bonusCode) {
        throw new GraphQLError('Unable to find bonus code.')
      }
      return await deleteBonusCode(id)
    } catch (error) {
      throw new GraphQLError(error)
    }
  },
})
