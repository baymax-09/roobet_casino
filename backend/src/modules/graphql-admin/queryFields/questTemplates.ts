import { queryField, list, nonNull } from 'nexus'

import { QuestsTemplatesDAO } from 'src/modules/inventory/lib'

export const QuestTemplatesQueryField = queryField('questTemplates', {
  type: nonNull(list('QuestTemplate')),
  description: 'Fetches the list of quest templates.',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'inventory', action: 'read' }],
  },
  resolve: async () => {
    return await QuestsTemplatesDAO.getQuestTemplates({})
  },
})
