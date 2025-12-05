import React from 'react'

import { useAccessControl } from 'admin/hooks'

type AccessControllerProps = React.PropsWithChildren<{
  rules: string[]
}>

export const AccessController: React.FC<AccessControllerProps> = ({
  children,
  rules,
}) => {
  const { hasAccess } = useAccessControl(rules)
  return hasAccess ? <>{children}</> : null
}

export const withRulesAccessController = <T extends object>(
  rules: string[],
  Component: React.ComponentType<T>,
) => {
  return (props: T) => (
    <AccessController rules={rules}>
      <Component {...props} />
    </AccessController>
  )
}
