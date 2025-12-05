import React, { type PropsWithChildren } from 'react'
import {
  Typography,
  Button,
  IconButton,
  type ButtonProps,
} from '@project-atl/ui'
import { ChevronLeft, Close } from '@project-atl/ui/assets'
import { Helmet } from 'react-helmet'

import { Dialog, Logo } from 'mrooi'
import { useTranslate, useDialogsOpener } from 'app/hooks'
import { type DialogProps } from 'app/types'

import GenericAuthDialogRightBanner from './GenericAuthDialogRightBanner'
import { LoginMode, type Mode } from '../AuthDialog/modes'

import { useGenericAuthDialogStyles } from './GenericAuthDialog.styles'

interface GenericAuthDialogProps {
  pageTitle: string
  header: string
  buttonLabel: string
  buttonProps?: ButtonProps
  subHeader: string | JSX.Element | null
  formSubmitHandler: React.FormEventHandler<HTMLFormElement> | undefined
  DialogProps: DialogProps
  endContent?: JSX.Element
  setMode: (mode: Mode, view?: 0 | 1 | null) => void
  backToLoginButton?: boolean
  backToLoginButtonText?: string
  backToLoginButtonOnClick?: () => void
  errorMessage?: string
  /**
   * Disable the close button and the escape key when set to false.
   * @default true
   */
  dismissible?: boolean
}

export const GenericAuthDialog: React.FC<
  PropsWithChildren<GenericAuthDialogProps>
> = ({
  pageTitle,
  header,
  subHeader,
  buttonLabel,
  buttonProps,
  formSubmitHandler,
  children,
  DialogProps,
  endContent,
  setMode,
  backToLoginButton = false,
  backToLoginButtonText,
  backToLoginButtonOnClick,
  errorMessage,
  dismissible = true,
}) => {
  const translate = useTranslate()
  const classes = useGenericAuthDialogStyles()
  const openDialog = useDialogsOpener()

  const backToLogin = React.useCallback(() => {
    setMode(LoginMode)
  }, [openDialog])

  return (
    <Dialog
      fullScreen
      {...DialogProps}
      disableEscapeKeyDown={!dismissible}
      disableEnforceFocus
      PaperProps={{
        sx: {
          borderRadius: { md: 0 },
          border: { md: 0 },
        },
      }}
    >
      <Helmet title={pageTitle} />
      <div className={classes.GenericAuthDialog}>
        <div className={classes.GenericAuthDialog__content}>
          <div className={classes.LogoCloseIconContainer}>
            <Logo className={classes.Logo} />
            {dismissible && (
              <IconButton
                className={classes.CloseIcon}
                onClick={DialogProps.onClose}
              >
                <Close />
              </IconButton>
            )}
          </div>
          <div className={classes.FormContainer}>
            <div className={classes.FormContainer__content}>
              <form className={classes.Form} onSubmit={formSubmitHandler}>
                <div>
                  <Typography className={classes.Header}>{header}</Typography>
                  {typeof subHeader === 'string' ? (
                    <Typography className={classes.Subheader} variant="body2">
                      {subHeader}
                    </Typography>
                  ) : (
                    subHeader
                  )}
                </div>
                {children}
                <div className={classes.MainButtonContainer}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="extraLarge"
                    label={buttonLabel}
                    {...buttonProps}
                  />
                  {errorMessage && (
                    <Typography
                      className={classes.ErrorMessage}
                      variant="body4"
                    >
                      {errorMessage}
                    </Typography>
                  )}
                </div>
                {backToLoginButton && (
                  <Button
                    className={classes.BackToLoginButton}
                    startIcon={<ChevronLeft />}
                    type="reset"
                    fullWidth
                    variant="text"
                    size="small"
                    label={
                      backToLoginButtonText ??
                      translate('twoFactorConfirm.backToLogin')
                    }
                    onClick={backToLoginButtonOnClick ?? backToLogin}
                  />
                )}
                {endContent}
              </form>
            </div>
          </div>
          <Typography
            className={classes.GenericAuthDialog__footer}
            variant="body4"
          >
            {translate('authDialog.termsOfServiceText')}
          </Typography>
        </div>
        <GenericAuthDialogRightBanner />
      </div>
    </Dialog>
  )
}
