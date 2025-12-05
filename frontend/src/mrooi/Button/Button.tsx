import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { type ButtonType } from './types'

import { useButtonStyles } from './Button.styles'

interface ButtonProps {
  type: ButtonType
  onClick?: (event: MouseEvent, target: any) => void
  className?: string
  disabled?: boolean
  active?: boolean
  to?: string
  outline?: boolean
  value?: any
}

export const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  type,
  onClick,
  className,
  disabled,
  active,
  to = null,
  children,
  outline = false,
  value,
}) => {
  const classes = useButtonStyles()
  const [targetValue, setTargetValue] = React.useState(null)

  const handleOnClick = event => {
    if (onClick) {
      onClick(event, targetValue)
    }
  }

  React.useEffect(() => {
    setTargetValue(value)
  }, [value])

  const cl = clsx(
    classes.button,
    type,
    className,
    outline && 'outlined',
    active && 'active',
  )

  if (to) {
    return (
      <Link to={to} className={cl}>
        {children}
      </Link>
    )
  }
  return (
    <button disabled={disabled} onClick={handleOnClick} className={cl}>
      {children}
    </button>
  )
}
