import { queryField, list, nonNull } from 'nexus'

import { getAllBonusCodes } from 'src/modules/crm/documents/bonusCode'

export const BonusCodesQueryField = queryField('bonusCodes', {
  type: nonNull(list('BonusCode')),
  description: 'Get all bonus codes',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'crm', action: 'read' }],
  },
  resolve: async () => {
    return await getAllBonusCodes()
  },
})
