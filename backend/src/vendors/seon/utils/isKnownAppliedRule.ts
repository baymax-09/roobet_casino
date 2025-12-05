import { AppliedRules, type AppliedRulesType } from '../types'

export const isKnownAppliedRule = (rule: any): rule is AppliedRulesType =>
  AppliedRules.includes(rule)
