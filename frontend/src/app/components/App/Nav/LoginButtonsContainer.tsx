import React from 'react'
import { Button, type ButtonProps, theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import clsx from 'clsx'

import { useDialogsOpener, useTranslate } from 'app/hooks'

interface LoginButtonsContainerProps {
  buttonProps?: Partial<ButtonProps>
  buttonContainerClassName?: string
}
export const useLoggedOutButtonContainertyles = makeStyles(() =>
  createStyles({
    LoginButtonsContainer: {
      display: 'flex',
      gap: uiTheme.spacing(0.5),
      padding: uiTheme.spacing(0.5),
      backgroundColor: uiTheme.palette.neutral[900],
      borderRadius: 16,
    },
  }),
)

export const LoginButtonsContainer: React.FC<LoginButtonsContainerProps> = ({
  buttonContainerClassName,
  buttonProps,
}) => {
  const classes = useLoggedOutButtonContainertyles()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()

  return (
    <div
      className={clsx(classes.LoginButtonsContainer, buttonContainerClassName)}
    >
      <Button
        onClick={() =>
          openDialog('auth', {
            params: {
              tab: 'login',
            },
          })
        }
        color="tertiary"
        variant="contained"
        label={translate('navbar.login')}
        {...buttonProps}
      />
      <Button
        onClick={() =>
          openDialog('auth', {
            params: {
              tab: 'register',
            },
          })
        }
        color="primary"
        variant="contained"
        label={translate('navbar.register')}
        {...buttonProps}
      />
    </div>
  )
}
