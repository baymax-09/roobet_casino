import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { getWithdrawal } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { rejectWithdrawal } from 'src/modules/withdraw/lib/arbitrate'
import { WithdrawStatusEnum } from 'src/modules/withdraw/types'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { type User } from 'src/modules/user/types/User'

export const FlaggedWithdrawalInput = inputObjectType({
  name: 'HandleWithdrawalInput',
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
      description: 'The id of the withdrawal.',
    })
    type.string('note', {
      auth: null,
      description:
        'The optional note on the flagged withdrawal dispute resolution.',
    })
  },
})

export const validateFlaggedWithdrawalUpdateRequest = async ({
  user,
  data,
}: {
  user?: User
  data: { id: string; note?: string | null }
}) => {
  if (!user) {
    throw new GraphQLError('Missing admin user in context.')
  }
  const adminUser = user

  const { id, note } = data
  const withdrawal = await getWithdrawal(id)

  if (!withdrawal) {
    throw new GraphQLError('Withdrawal does not exist.')
  }

  const { userId, status } = withdrawal
  const message = `Flagged Withdrawal Note: ${id} ${note ?? ''}`

  if (status !== WithdrawStatusEnum.FLAGGED) {
    throw new GraphQLError(
      'Withdrawal status is not flagged, therefore the withdrawal cannot be approved or rejected.',
    )
  }

  if (note) {
    await addNoteToUser(userId, adminUser, message, 'admin')
  }

  return { adminUser, id, message, withdrawal }
}

export const FlaggedWithdrawalRejectMutationField = mutationField(
  'rejectFlaggedWithdrawal',
  {
    description: 'Rejects a flagged withdrawal.',
    type: 'Withdrawal',
    args: { data: nonNull(FlaggedWithdrawalInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'withdrawals', action: 'update_flagged' }],
    },
    resolve: async (_, { data }, { user }) => {
      const { adminUser, message, withdrawal } =
        await validateFlaggedWithdrawalUpdateRequest({ user, data })
      return await rejectWithdrawal({
        adminUser,
        message,
        withdrawal,
      })
    },
  },
)
