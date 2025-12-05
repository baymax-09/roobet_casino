import { queryField, list, nonNull, stringArg, booleanArg } from 'nexus'

import { getQuests } from 'src/modules/inventory/documents/quests'

export const QuestsACPQueryField = queryField('questsACP', {
  type: nonNull(list('Quest')),
  description:
    'Fetches a list of quests based off the criteria type in the ACP.',
  args: {
    criteriaType: stringArg(),
    completed: booleanArg(),
    userId: stringArg(),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'inventory', action: 'read' }],
  },
  resolve: async (_, { criteriaType, completed, userId }) => {
    const filter = { userId, criteriaType, completed }
    return await getQuests({ filter })
  },
})
