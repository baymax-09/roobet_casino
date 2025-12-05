import { hasAccess } from 'common/util'
import { useUser } from 'common/hooks'

export function useAccessControl(rules: string[]): { hasAccess: boolean } {
  const user = useUser()
  const userRules = user?.rules ?? []

  const access = hasAccess({ userRules, rules })
  return { hasAccess: access }
}
