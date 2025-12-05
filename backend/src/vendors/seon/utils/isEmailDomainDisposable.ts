import { type SeonResponse, type Action } from '../types'

export const isEmailDomainDisposable = (
  actionType: Action,
  response: SeonResponse,
) => {
  // Only care for checking on user signup
  if (actionType !== 'user_signup') {
    return false
  }

  const {
    success,
    data: { applied_rules },
  } = response
  if (!success) {
    return false
  }
  if (!applied_rules) {
    return false
  }
  return applied_rules.some(rule => rule.id === 'E100')
}
