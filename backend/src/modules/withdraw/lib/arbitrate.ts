import { createAuditRecord } from 'src/modules/audit'
import { creditBalance } from 'src/modules/user/balance'
import { PluginMap } from 'src/modules/withdraw/lib/plugins'
import { type User } from 'src/modules/user/types/User'
import { updateWithdrawalStatus } from 'src/modules/withdraw/documents/withdrawals_mongo'
import {
  type WithdrawalMongo,
  WithdrawStatusEnum,
} from 'src/modules/withdraw/types'
import { getUserById } from 'src/modules/user'

interface ArbitrateWithdrawalProps {
  adminUser: User
  message?: string
  shouldReject?: boolean
  withdrawal: WithdrawalMongo
}

export const rejectWithdrawal = async ({
  adminUser,
  message,
  withdrawal,
}: ArbitrateWithdrawalProps) => {
  return await arbitrateWithdrawal({
    adminUser,
    message,
    withdrawal,
  })
}

export const approveWithdrawal = async ({
  adminUser,
  message,
  withdrawal,
}: ArbitrateWithdrawalProps) => {
  return await arbitrateWithdrawal({
    adminUser,
    message,
    shouldReject: false,
    withdrawal,
  })
}

const arbitrateWithdrawal = async ({
  adminUser,
  message = '',
  shouldReject = true,
  withdrawal,
}: ArbitrateWithdrawalProps) => {
  const auditData = {
    editorId: adminUser.id,
    subjectId: withdrawal.userId,
    notes: message,
    databaseAction: 'edit',
    actionType: shouldReject
      ? 'flaggedWithdrawalRejection'
      : 'flaggedWithdrawalApproval',
    meta: {
      withdrawalId: withdrawal.id,
    },
  } as const

  const newStatus = shouldReject
    ? WithdrawStatusEnum.CANCELLED
    : WithdrawStatusEnum.PENDING

  const updatedWithdrawal = await createAuditRecord(
    auditData,
    async () => await updateWithdrawalStatus(withdrawal.id, newStatus),
  )

  if (shouldReject) {
    const balanceType = PluginMap[withdrawal.plugin]

    const user = await getUserById(withdrawal.userId)

    if (user) {
      await creditBalance({
        user,
        amount: withdrawal.totalValue,
        meta: {},
        transactionType: 'cancelledWithdrawal',
        balanceTypeOverride: balanceType,
      })
    }
  }
  return updatedWithdrawal
}
