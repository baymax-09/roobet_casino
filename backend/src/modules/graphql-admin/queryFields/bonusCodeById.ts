import { queryField, nonNull, idArg } from 'nexus'

import { getBonusCodeById } from 'src/modules/crm/documents/bonusCode'

export const BonusCodeByIdQueryField = queryField('bonusCodeById', {
  type: 'BonusCode',
  description: 'Get a bonus code by id',
  args: { id: nonNull(idArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'crm', action: 'read' }],
  },
  resolve: async (_, { id }) => {
    return (await getBonusCodeById(id)) ?? null
  },
})
