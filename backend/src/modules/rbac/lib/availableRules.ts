import { RBACPaths, type RBACRule } from '../types/role'

function buildAvailableRules(): Array<{ rule: RBACRule }> {
  const combinations: Array<{ rule: RBACRule }> = []

  const keys = Object.keys(RBACPaths) as Array<keyof typeof RBACPaths>
  // Make sure the double wildcard is added
  combinations.push({ rule: '*:*' })
  for (const resource of keys) {
    // Add initial wildcard for the resource
    combinations.push({ rule: `${resource}:*` })

    const actions = RBACPaths[resource]
    for (const action of actions) {
      const combination: { rule: RBACRule } = {
        rule: `${resource}:${action}` as RBACRule,
      }
      combinations.push(combination)
    }
  }

  return combinations
}

export const availableRules = buildAvailableRules()
