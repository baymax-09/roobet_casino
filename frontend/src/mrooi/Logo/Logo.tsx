import React from 'react'
import clsx from 'clsx'

import logoImage from 'assets/images/logo.svg'

import { useLogoStyles } from './Logo.styles'

interface LogoProps {
  className?: string
}

export const Logo: React.FC<LogoProps> = React.memo(({ className }) => {
  const classes = useLogoStyles()

  return (
    <img
      className={clsx(classes.root, className)}
      alt="Roobet"
      src={logoImage}
    />
  )
})

Logo.displayName = 'Logo'
