import React, { type PropsWithChildren } from 'react'
import clsx from 'clsx'

import { useBlockTemplateStyles } from './BlockTemplate.styles'

interface BlockTemplateProps {
  padding?: string
  contentContainerClassName?: string
}

export const BlockTemplate: React.FC<PropsWithChildren<BlockTemplateProps>> = ({
  padding,
  contentContainerClassName,
  children,
}) => {
  const classes = useBlockTemplateStyles({ padding })

  return (
    <div className={classes.BlockTemplate}>
      <div
        className={clsx(classes.ContentContainer, contentContainerClassName)}
      >
        {children}
      </div>
    </div>
  )
}
