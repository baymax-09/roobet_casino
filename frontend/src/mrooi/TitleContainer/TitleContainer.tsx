import React from 'react'
import clsx from 'clsx'
import {
  Button,
  Typography,
  type ButtonProps as ButtonPropsType,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { Link } from 'react-router-dom'

import { useTitleContainerStyles } from './TitleContainer.styles'

interface ButtonProps extends ButtonPropsType {
  value: string
}

interface TitleContainerProps {
  title: string
  prependActionButtons?: React.ReactNode[]
  actions: () => ButtonProps[]
  returnTo?: {
    title: string
    link?: string
  }
}
export const TitleContainer: React.FC<
  React.PropsWithChildren<TitleContainerProps>
> = ({ title, actions, returnTo, children, prependActionButtons }) => {
  const classes = useTitleContainerStyles()

  return (
    <div className={classes.root}>
      {returnTo && (
        <div className={classes.returnTo}>
          <Typography variant="h3" className={classes.returnToLink}>
            {returnTo.link ? (
              <Link to={returnTo.link}>
                <ArrowBack /> {returnTo.title}
              </Link>
            ) : (
              returnTo.title
            )}
          </Typography>
        </div>
      )}
      <div className={classes.header}>
        <Typography variant="h3">{title}</Typography>
        <div className={classes.actions}>
          {prependActionButtons}
          {actions().map(({ value, ...btnProps }, i) => (
            <Button
              key={i}
              size="large"
              color="primary"
              variant="contained"
              {...btnProps}
              className={clsx(classes.actionButton, btnProps.className)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      <div className={classes.container}>{children}</div>
    </div>
  )
}
