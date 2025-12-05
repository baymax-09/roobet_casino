import React from 'react'
import clsx from 'clsx'

import leftFlame from 'assets/images/slotPotato/leftFlame.svg'

import { useContainerWithFlameStyles } from './ContainerWithFlame.styles'

interface ContainerWithFlameProps {
  noPadding?: boolean
  noBackground?: boolean
  withFlame?: boolean
  className?: string
  node: React.ReactNode
}

export const ContainerWithFlame: React.FC<ContainerWithFlameProps> = ({
  noPadding = false,
  noBackground = false,
  withFlame = true,
  className,
  node,
}) => {
  const classes = useContainerWithFlameStyles({ bannerBackgroundImage: '' })

  return (
    <div className={clsx(classes.ContainerWithFlame, className)}>
      {withFlame && (
        <div style={{ position: 'relative' }}>
          <img
            className={classes.LeftFlame}
            alt="flame"
            src={leftFlame}
            height="100%"
          />
        </div>
      )}
      <div
        className={clsx(classes.ContentContainer, {
          [classes.ContentContainer_noPadding]: noPadding,
          [classes.ContentContainer_noBackground]: noBackground,
        })}
      >
        {node}
      </div>
    </div>
  )
}
