import { getUserById } from 'src/modules/user'
import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import {
  handleRejectListOnDecline,
  handleAllowanceListForRules,
} from 'src/vendors/seon'
import { RiskStatus, type SeonResponseJob } from 'src/vendors/seon/types'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'

import { handleNotifications } from './handleNotifications'
import { lockDownUser } from 'src/modules/fraud/util'
import { changeSystemsEnabledUser } from 'src/modules/userSettings'
import { fraudLogger } from '../../lib/logger'

/**
 * Regex for finding KYC Level 2 Threshold rules.
 */
const kycLevel2RegEx = /KYC Level 2 Threshold/i
/**
 * Regex for determining failed rules.
 */
const ruleOpsNeg = [/decline/i, /blacklist/i, /-/i]

export async function handler(payload: SeonResponseJob) {
  const logger = fraudLogger('worker/handler', { userId: payload.userId })
  logger.info(`Risk jobs: Seon payload - ${payload}`, { payload })

  const {
    userId,
    actionType,
    data: { id, state, applied_rules },
  } = payload

  const user = await getUserById(userId)

  if (!user) {
    return
  }

  try {
    await handleNotifications(payload, user, actionType)
  } catch (error) {
    logger.error(
      'Risk notification failure',
      { payload, user, actionType },
      error,
    )
  }

  try {
    if (state === RiskStatus.DECLINED) {
      if (actionType === 'user_signup') {
        await handleAllowanceListForRules(user.id, applied_rules)
      }

      if (actionType === 'kyc_level1_save') {
        // If the action type is `kyc_level1_save`, do nothing because we already do it when making the Seon request.
        return
      }

      if (actionType === 'tip') {
        // Don’t disable anything except tips PD-3760
        await changeSystemsEnabledUser(userId, ['tip'], false)
        return
      }

      await handleRejectListOnDecline(
        user.id,
        id,
        'Seon - Declined - KYC Level 2',
      )

      const mustManualLock = applied_rules?.some(
        rule =>
          !kycLevel2RegEx.test(rule.name) &&
          ruleOpsNeg.some(op => op.test(rule.operation)),
      )
      if (mustManualLock) {
        await lockDownUser(
          user.id,
          ['withdraw', 'deposit', 'tip'],
          'Seon - Declined Non-KYC Rule - Manual Lock Required',
        )
      }
    }
  } catch (error) {
    logger.error('error getting stats', { state, actionType }, error)
  }
}

const start = async () => {
  if (config.isProd || config.isStaging) {
    await createConsumer({
      exchangeName: 'events',
      routingKey: 'events.seonHooks',
      queue: 'seonHooks',
      handler,
    })
  }
}

export const run = async () => {
  runWorker('riskJobs', start)
}
