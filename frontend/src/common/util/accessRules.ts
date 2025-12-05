interface HasAccessProps {
  rules: string[]
  userRules: string[]
}

export const hasAccess = ({ userRules, rules }: HasAccessProps): boolean => {
  const ruleEvaluations = rules.map(rule => {
    return !!userRules.find(r => {
      // Evaluate non-wildcard rules without a regex
      if (r === rule) {
        return true
      }
      const ruleRegex = r.replace(/[*]/g, '.*').toLowerCase().trim()
      return new RegExp(`^${ruleRegex}$`).test(rule)
    })
  })

  const rulesEvaluationSet = new Set(ruleEvaluations)
  // All rules evaluated to true
  return rulesEvaluationSet.size === 1 && rulesEvaluationSet.has(true)
}
