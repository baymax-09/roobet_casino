import React from 'react'
import { useToggle } from 'react-use'
import { useForm } from 'react-hook-form'
import { Grid, IconButton } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons'

import { useTranslate } from 'app/hooks'
import { AuthDialogField } from 'app/dialogs/AuthDialog'
import { env } from 'common/constants'

import { GenericAuthDialog } from '../GenericAuthDialog'
import { useConfirmAccountLinkDialogStyles } from './ConfirmAccountLinkDialog.style'

export const ConfirmAccountLinkDialog = ({ params, DialogProps }) => {
  const { uniqueId, userId, provider, accessToken, name } = params

  const [busy, setBusy] = React.useState(false)
  const passwordRef = React.useRef<HTMLInputElement | null>(null)

  const [showPasswordText, togglePasswordVisibility] = useToggle(false)

  const classes = useConfirmAccountLinkDialogStyles({ showPasswordText })
  const translate = useTranslate()

  const { register, handleSubmit, errors } = useForm<{
    password: string
  }>({
    shouldFocusError: true,
    shouldUnregister: false,
    defaultValues: {},
  })

  const onSubmit = values => {
    setBusy(true)
    const confirmLinkParams: Record<string, string> = {
      uniqueId,
      userId,
      password: values.password,
    }
    if (accessToken) {
      confirmLinkParams.accessToken = accessToken
    }
    if (name) {
      confirmLinkParams.name = name
    }
    window.location.href = `${
      env.API_URL
    }/auth/oauth/${provider}/confirmLink?${new URLSearchParams(
      confirmLinkParams,
    ).toString()}`
  }

  return (
    <GenericAuthDialog
      pageTitle={translate('authDialog.register')}
      header={translate('authDialog.login')}
      subHeader={translate('authDialog.passwordToLink')}
      buttonLabel={translate('authDialog.login')}
      buttonProps={{
        'aria-label': 'Confirm password',
        disabled: busy,
      }}
      formSubmitHandler={handleSubmit(onSubmit)}
      DialogProps={{
        onClick: () => {
          if (DialogProps?.onClick) {
            DialogProps?.onClick()
          }
          // TODO: Do we even need this??
          // window.location.href = '/'
        },
        ...DialogProps,
      }}
    >
      <div className={classes.DialogContent__callToAction}>
        <div className={classes.CallToAction__innerContent}>
          <Grid item xs={12}>
            <AuthDialogField
              ref={elem => {
                passwordRef.current = elem
                register(elem, { required: true })
              }}
              name="password"
              error={errors.password}
              type={!showPasswordText ? 'password' : 'text'}
              placeholder={translate('authDialog.password')}
              disabled={busy}
              label={translate('authDialog.password')}
              endAdornment={
                <IconButton
                  aria-label={translate('authDialog.togglePasswordVisibility')}
                  className={classes.Form__passwordVisibilityButton}
                  onClick={togglePasswordVisibility}
                  size="small"
                >
                  <FontAwesomeIcon
                    icon={!showPasswordText ? faEyeSlash : faEye}
                  />
                </IconButton>
              }
            />
          </Grid>
        </div>
      </div>
    </GenericAuthDialog>
  )
}
