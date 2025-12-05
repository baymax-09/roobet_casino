import { isKnownAppliedRule } from 'src/vendors/seon'
import {
  RiskStatus,
  type SeonResponseJob,
  type Action,
} from 'src/vendors/seon/types'
import { slackSeonFraudAlert, slackSeonRuleAlert } from 'src/vendors/slack'
import { type User } from 'src/modules/user/types'

export async function handleNotifications(
  payload: SeonResponseJob,
  user: User,
  actionType: Action,
) {
  let rulesToLogIfDeclined = '*Applied Rules:* \n'
  if (payload.data.applied_rules) {
    for (const rule of payload.data.applied_rules) {
      rulesToLogIfDeclined += `- ${decodeURI(rule.name)} \n`
      if (isKnownAppliedRule(rule.id)) {
        const message = `*${rule.name}* [${rule.id}] \n *${user.name}* [${user.id}] \n *Action Type*: ${actionType}`
        slackSeonRuleAlert(message)
      }
    }
  }

  if (payload.data.state === RiskStatus.DECLINED) {
    slackSeonFraudAlert(
      `*${user.name}* [${user.id}] DECLINED \n *Action Type*: ${actionType} \n ${rulesToLogIfDeclined}`,
    )
  }
}
