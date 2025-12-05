import {
  type JoinedRBACRole,
  getRoles,
  getJoinedRBACRolesBySlugs,
} from '../documents/RBACRoles'
import {
  type RBACRule,
  type RBACRequests,
  type RBACResource,
  type RBACRequest,
} from '../types'
import { availableRules } from './availableRules'

/** @todo figure out why TypeScript won't associate these in the return interpolation and remove type assertion. */
const joinRequest = <T extends RBACResource>(
  request: RBACRequest<T>,
): RBACRule => `${request.resource}:${request.action}` as RBACRule

/**
 * Utility function for splitting rules into resource and action to contain the type assertion.
 */
const splitRBACRule = (rule: RBACRule): RBACResource => {
  const [resource] = rule.split(':') as [RBACResource]
  return resource
}

/**
 * When resolving the list of allowed rules, we must be able to subtract explicit denies from wildcard allows.
 * @note Exported for Jest only.
 */
export const expandWildCard = (incomingRule: RBACRule): RBACRule[] => {
  // Double star is a special case, the only wildcard resource
  if (incomingRule === '*:*') {
    // Expands to all available non-wildcard rules.
    return availableRules
      .map(({ rule }) => rule)
      .filter(rule => !rule.includes('*'))
  }

  // Wildcard action expands to all non-wildcard actions of that resource.
  const [resource, action] = incomingRule.split(':')
  if (action === '*') {
    return availableRules
      .map(({ rule }) => rule)
      .filter(rule => !rule.includes('*') && rule.split(':')[0] === resource)
  }

  // Non-wildcard rule expands to itself.
  return [incomingRule]
}

/**
 * Util for bucketing all policies into allow and deny sets for processing.
 */
const gatherEffects = (roles: JoinedRBACRole[]) => {
  const effects = { allow: new Set<RBACRule>(), deny: new Set<RBACRule>() }

  roles.forEach(({ policies }) => {
    policies.forEach(({ rules, effect }) => {
      rules.forEach(rule => {
        effects[effect].add(rule)
      })
    })
  })

  return effects
}

/**
 * Find the intersection of the allowed and denied rules for each policy on each role in a list of roles.
 * @note Exported for Jest only.
 */
export const resolveAllowedRulesFromRoles = (roles: JoinedRBACRole[]) => {
  const effects = gatherEffects(roles)

  // I understand these following comparisons/filtering seems verbose but I figured it was safer than trying to write
  // convoluted glob or regex matching. Double star is a special case, the only wildcard resource.
  if (effects.deny.has('*:*')) {
    return []
  }

  // To be able to subtract explicit denies from wildcard allows, we must expand the competing allow.
  ;[...effects.allow].forEach(allowedRule => {
    if (allowedRule.includes('*')) {
      const resource = allowedRule.split(':')[0]
      if (
        [...effects.deny].some(deniedRule =>
          deniedRule.startsWith(`${resource}:`),
        )
      ) {
        effects.allow.delete(allowedRule)
        expandWildCard(allowedRule).forEach(explicit =>
          effects.allow.add(explicit),
        )
      }
    }
  })

  // Filter any allowed rules that are denied explicitly or by wildcard.
  const allowed = [...effects.allow]
    .filter(allowedRule => {
      const deniedResource = splitRBACRule(allowedRule)
      return !(
        effects.deny.has(allowedRule) || effects.deny.has(`${deniedResource}:*`)
      )
    })
    .sort()

  return allowed
}

/**
 * Resolves a list of role slugs into a list of allowed rules.
 */
export const resolveAllowedRulesFromRoleSlugs = async (roleSlugs: string[]) => {
  const roles = await getJoinedRBACRolesBySlugs(roleSlugs)
  return resolveAllowedRulesFromRoles(roles)
}

/**
 * Resolve all policies in Mongo into a list of rules for ACP.
 */
export const resolveAllRoles = async () => {
  const roles = await getRoles({ joinPolicies: true })
  const result = roles
    .map(role => ({
      role: role.slug,
      rules: resolveAllowedRulesFromRoles([role]),
    }))
    .sort((a, b) => a.role.localeCompare(b.role))
  return result
}

/**
 * Every requested resource/action should match at least one grant in the user's allowed rules and match no denies.
 * @note Exported for Jest only.
 */
export const compareGrantsToRequest = (
  roles: JoinedRBACRole[],
  requests: RBACRequests,
) => {
  const effects = gatherEffects(roles)

  const permit = requests.every(request => {
    // Double star is a special case, the only wildcard resource
    const typedRule = joinRequest(request)
    const rulePermutations = [
      '*:*',
      `${request.resource}:*`,
      typedRule,
    ] as const

    return (
      rulePermutations.some(rule => effects.allow.has(rule)) &&
      !rulePermutations.some(rule => effects.deny.has(rule))
    )
  })

  return permit
}

export const isPermitted = async (
  roleSlugs: string[],
  requests: RBACRequests,
): Promise<boolean> => {
  const roles = await getJoinedRBACRolesBySlugs(roleSlugs)

  return compareGrantsToRequest(roles, requests)
}
