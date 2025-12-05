import { mutationField, nonNull } from 'nexus'

import { approveWithdrawal } from 'src/modules/withdraw/lib/arbitrate'

import {
  FlaggedWithdrawalInput,
  validateFlaggedWithdrawalUpdateRequest,
} from './flaggedWithdrawalReject'

export const FlaggedWithdrawalApproveMutationField = mutationField(
  'approveFlaggedWithdrawal',
  {
    description: 'Approves a flagged withdrawal.',
    type: 'Withdrawal',
    args: { data: nonNull(FlaggedWithdrawalInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'withdrawals', action: 'update_flagged' }],
    },
    resolve: async (_, { data }, { user }) => {
      const { adminUser, message, withdrawal } =
        await validateFlaggedWithdrawalUpdateRequest({ user, data })
      return await approveWithdrawal({
        adminUser,
        message,
        withdrawal,
      })
    },
  },
)
