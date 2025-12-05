import { subscriptionField, nonNull } from 'nexus'

import { type DBWithdrawal } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { pubsub } from 'src/util/graphql'

import { events } from './events'

export const FlaggedWithdrawalCreatedSubscriptionField = subscriptionField(
  'flaggedWithdrawalCreated',
  {
    type: nonNull('Withdrawal'),
    description: 'Subscribe for newly flagged withdrawals.',
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'withdrawals', action: 'read_flagged' }],
    },
    subscribe: () => pubsub.asyncIterator([events.FLAGGED_WITHDRAWAL_CREATED]),
    resolve: (payload: DBWithdrawal) => payload,
  },
)
