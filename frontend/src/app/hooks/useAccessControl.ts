import { useSelector, shallowEqual } from 'react-redux'

import { hasAccess } from 'common/util'

export function useAccessControl(rules: string[]): { hasAccess: boolean } {
  const userRules = useSelector(({ user }) => user?.rules ?? [], shallowEqual)

  const access = hasAccess({ userRules, rules })
  return { hasAccess: access }
}
