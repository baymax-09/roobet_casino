import { queryField, list, nonNull, stringArg } from 'nexus'

import { getBetActivityForUser } from 'src/modules/bet/documents/bet_history_mongo'

export const BetActivityQueryField = queryField('playerBetActivity', {
  type: list('BetActivityType'),
  description: 'Generate Bet Activity Report',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'bets', action: 'read' }],
  },
  args: {
    userId: nonNull(stringArg()),
    startDate: nonNull(stringArg()),
    endDate: nonNull(stringArg()),
  },
  resolve: async (_, args) => {
    const { userId, startDate, endDate } = args
    return await getBetActivityForUser(userId, startDate, endDate)
  },
})
