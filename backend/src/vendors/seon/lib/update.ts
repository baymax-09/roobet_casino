import { translateForUser } from 'src/util/i18n'

import { config } from 'src/system'
import {
  createNotification,
  getUserById,
  lockUser,
  unlockUser,
  updateUser,
} from 'src/modules/user'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { type NotificationType } from 'src/modules/messaging/notifications/types'
import { type User } from 'src/modules/user/types'
import { updateByUserId } from 'src/modules/fraud/kyc/documents/kyc'

import {
  type PayloadValue,
  type SeonAppliedRule,
  type State,
  type CustomState,
} from '../types'

/** Update internal data based on risk assessments */

interface SeonDeclineArgs {
  user: User
  noteMessage: string
  notificationMessage: string
  notificationType: NotificationType
  lockReason: string
}

const seonLockUser = async (userId: string) => {
  const result = await lockUser(userId, 'User locked by Seon.')
  if (result) {
    await addNoteToUser(
      userId,
      { id: 'seon', name: 'seon', department: 'Compliance' },
      'User locked by Seon.',
    )
  }
}

const seonUnlockUser = async (userId: string) => {
  const result = await unlockUser(userId)
  if (result) {
    await addNoteToUser(
      userId,
      { id: 'seon', name: 'seon', department: 'Compliance' },
      'User unlocked by Seon.',
    )
  }
}

const seonAllowlistUser = async (userId: string) => {
  const result = await unlockUser(userId)
  if (result) {
    await addNoteToUser(
      userId,
      { id: 'seon', name: 'seon', department: 'Compliance' },
      'User Allowlisted by Seon.',
    )
  }
}

const seonDeclineAndLockUser = async ({
  user,
  noteMessage,
  notificationMessage,
  notificationType,
  lockReason,
}: SeonDeclineArgs) => {
  await updateUser(user.id, { kycRequiredLevel: 2 })
  await updateByUserId(user.id, {
    kycRequiredReason: lockReason,
    kycRestrictAccount: true,
  })
  await createNotification(user.id, notificationMessage, notificationType)
  await addNoteToUser(
    user.id,
    { id: 'seon', name: 'seon', department: 'Compliance' },
    noteMessage,
  )
}

const seonAmlKycUser = async (userId: string, lockReason: string) => {
  const noteMessage = 'User KYC Required Level set to 2 by Seon.'
  const user = await getUserById(userId)
  if (user) {
    const notificationMessage = translateForUser(user, 'kyc__needed', ['2'])
    await seonDeclineAndLockUser({
      user,
      noteMessage,
      notificationMessage,
      notificationType: 'kyc',
      lockReason,
    })
  }
}

const seonListUser = async (userId: string, appliedRule?: SeonAppliedRule) => {
  if (!appliedRule) {
    return
  }
  if (
    appliedRule.name
      .toLowerCase()
      .includes(config.seon.amlKyc2RulePattern.toLowerCase())
  ) {
    await seonAmlKycUser(userId, `Seon - AML - ${appliedRule.name}`)
  }
}

const OperationMap: Readonly<Record<string, State>> = {
  BLACKLIST: 'blacklist',
  WHITELIST: 'whitelist',
  NORMAL: 'normal',
  LIST: 'list',
}

const userActionMap: Readonly<
  Record<
    State,
    (userId: string, appliedRule?: SeonAppliedRule) => Promise<void>
  >
> = {
  blacklist: seonLockUser,
  normal: seonUnlockUser,
  whitelist: seonAllowlistUser,
  list: seonListUser,
}

const customListActionMap: Readonly<
  Record<CustomState, (userId: string, lockReason: string) => Promise<void>>
> = {
  deposit_aml_threshold_level_2: seonAmlKycUser,
  withdrawal_aml_threshold_level_2: seonAmlKycUser,
}

/**
 * @param userId we assume that this userId corresponds to a valid user
 */
export async function handleRejectListOnDecline(
  userId: string,
  transactionId: string,
  lockReason: string,
) {
  const noteMessage = `Transaction ID ${transactionId} declined by Seon. Deposits, Tips and Withdrawals disabled.`
  const user = await getUserById(userId)
  if (user) {
    const notificationMessage = translateForUser(user, 'kyc__needed', ['2'])
    await seonDeclineAndLockUser({
      user,
      noteMessage,
      notificationMessage,
      notificationType: 'kyc',
      lockReason,
    })
  }
}

export async function handleAllowanceListForRules(
  userId: string,
  appliedRules: SeonAppliedRule[] | null,
) {
  if (!appliedRules) {
    return
  }

  for (const rule of appliedRules) {
    const action = OperationMap[rule.operation]
    if (action) {
      userActionMap[action](userId, rule)
    }
  }
}

export async function handleAllowanceListWebhook(
  values: Array<PayloadValue<State>>,
) {
  for (const value of values) {
    if (value.data_field === 'user_id') {
      const user = await getUserById(value.value)
      if (user?.id) {
        await userActionMap[value.state](user.id)
      }
    }
  }
}

export const handleCustomListWebhook = async (
  values: Array<PayloadValue<CustomState>>,
) => {
  for (const value of values) {
    if (value.data_field === 'user_id') {
      if (customListActionMap[value.state]) {
        await customListActionMap[value.state](
          value.value,
          `Seon - Custom Rule - ${value.state}`,
        )
      }
    }
  }
}
