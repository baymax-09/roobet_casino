export const PolicyEffects = ['deny', 'allow'] as const
export type PolicyEffect = (typeof PolicyEffects)[number]

export interface RbacRole {
  id?: string
  name: string
  slug: string
  userIds: string[]
  policyIds: string[]
}

// Errors
export interface RbacRoleSubmitErrors {
  id?: string
  name?: string
  slug?: string
  userIds?: string[]
  policyIds?: string[]
}

export interface RbacPolicy {
  id?: string
  name: string
  slug: string
  effect: PolicyEffect
  rules: string[]
}

// Errors
export interface RbacPolicySubmitErrors {
  id?: string
  name?: string
  slug?: string
  effect?: PolicyEffect
  rules?: string[]
}
