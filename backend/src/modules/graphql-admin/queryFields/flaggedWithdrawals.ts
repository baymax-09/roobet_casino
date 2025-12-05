import { queryField, list, nonNull } from 'nexus'

import { getFlaggedWithdrawals } from 'src/modules/withdraw/documents/withdrawals_mongo'

export const FlaggedWithdrawalsQueryField = queryField(
  'flaggedWithdrawalsQuery',
  {
    type: nonNull(list(nonNull('Withdrawal'))),
    description: 'Get all flagged withdrawals.',
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'withdrawals', action: 'read_flagged' }],
    },
    resolve: async () => {
      return await getFlaggedWithdrawals({})
    },
  },
)
