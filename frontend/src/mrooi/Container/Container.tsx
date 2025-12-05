import React from 'react'
import clsx from 'clsx'

import { useContainerStyles } from './Container.styles'

interface ContainerProps {
  className?: string
}

export const Container: React.FC<React.PropsWithChildren<ContainerProps>> = ({
  children,
  className,
}) => {
  const classes = useContainerStyles()

  return <div className={clsx(classes.container, className)}>{children}</div>
}
