import React from 'react'
import { Link as RRLink } from 'react-router-dom'

import { isUrlExternal } from 'common/util'

type LinkProps = React.PropsWithChildren<{
  urlOrPath: string
  target?: string
}>

/**
 * Unstyled link component that can handle paths or resolved urls.
 */
export const Link: React.FC<LinkProps> = ({
  urlOrPath,
  children,
  target = '_blank',
}) => {
  const [href, isExternal] = React.useMemo(() => {
    try {
      const parsed = new URL(urlOrPath)

      if (isUrlExternal(parsed.href)) {
        return [parsed.href, true]
      }

      const path = `${parsed.pathname}${parsed.search ?? ''}${
        parsed.hash ?? ''
      }`

      return [path, false]
    } catch {}

    return [urlOrPath, false]
  }, [urlOrPath])

  return isExternal ? (
    <a href={href} target={target} rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <RRLink to={href} target={target}>
      {children}
    </RRLink>
  )
}
