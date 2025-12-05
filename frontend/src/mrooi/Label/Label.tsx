import React from 'react'
import clsx from 'clsx'

import { useLabelStyles } from './Label.styles'

type LabelProps = React.PropsWithChildren<{
  className: string
}>

export const Label: React.FC<LabelProps> = ({ className, children }) => {
  const classes = useLabelStyles()
  const cl = clsx(classes.label, className)

  return <label className={cl}>{children}</label>
}
