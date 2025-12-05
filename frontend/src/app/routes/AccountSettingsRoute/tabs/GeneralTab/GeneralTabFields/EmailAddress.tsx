import React from 'react'
import clsx from 'clsx'
import { useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import { Button, InputField, theme as uiTheme } from '@project-atl/ui'

import { api } from 'common/util'
import { useTranslate } from 'app/hooks'
import { store } from 'app/util'
import { setUser } from 'app/reducers/user'

import { useGeneralTabStyles } from '../GeneralTab.styles'
import { VisibilityButton } from '../../VisibilityButton'
import { SuccessMessage } from './SuccessMessage'

export const EmailAddress: React.FC = () => {
  const classes = useGeneralTabStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const currentEmail = useSelector(({ user }) => user?.email ?? '')
  const emailVerified = useSelector(
    ({ user }) => !!user?.email && user.email.length > 3 && user.emailVerified,
  )
  const profileSettings = useSelector(
    ({ user }) => user?.systemSettings.profile.editable,
  )

  const [busy, setBusy] = React.useState(false)
  const [email, setEmail] = React.useState(currentEmail)
  const [showSensitiveData, setShowSensitiveData] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  )
  const [verifying, setVerifying] = React.useState(false)

  const updateEmailButtonRef = React.useRef<HTMLButtonElement>(null)

  const resendVerificationEmail = React.useCallback(
    event => {
      const send = async () => {
        try {
          const response = await api.post<null, { success: boolean }>(
            '/email/resendVerificationEmail',
          )

          if (!response.success) {
            setErrorMessage(translate('accountTab.tryAgainLater'))
          }

          setSuccessMessage(translate('accountTab.verificationEmailSent'))
          // Disable button after they verify their email
          setVerifying(true)
        } catch (err) {
          // @ts-expect-error TODO Axios error interface
          setErrorMessage(err.response ? err.response.data : err.message)
        } finally {
          setBusy(false)
        }
      }

      setSuccessMessage(null)
      setErrorMessage(null)
      setBusy(true)
      send()
    },
    [setBusy],
  )

  const updateEmail = React.useCallback(() => {
    const update = async () => {
      try {
        const { email: updatedEmailAddress } = await api.post<
          { email: string },
          { email: string }
        >('/auth/setEmail', {
          email,
        })

        setSuccessMessage(translate('accountTab.verificationEmailSent'))
        store.dispatch(setUser({ email: updatedEmailAddress }))
        // Disable button after they verify their email
        setVerifying(true)
        setEmail(updatedEmailAddress)
      } catch (err) {
        // @ts-expect-error TODO Axios error interface
        setErrorMessage(err.response ? err.response.data : err.message)
      } finally {
        setBusy(false)
      }
    }

    setSuccessMessage(null)
    setErrorMessage(null)

    setBusy(true)
    update()
  }, [email, setBusy])

  React.useEffect(() => {
    setEmail(currentEmail)
  }, [currentEmail])

  const userNeedsToConfirmEmail = currentEmail.length > 0 && !emailVerified
  const determineOnClick = event => {
    if (userNeedsToConfirmEmail) {
      if (email === currentEmail) {
        return resendVerificationEmail(event)
      } else {
        return updateEmail()
      }
    } else {
      updateEmail()
    }
  }

  const showBottomMessage = !!errorMessage || !!successMessage || emailVerified

  return (
    <>
      <InputField
        color="secondary"
        type={
          !showSensitiveData && profileSettings?.maskSensitiveData
            ? 'password'
            : 'email'
        }
        disabled={busy || emailVerified}
        value={email}
        onChange={event => setEmail(event.target.value)}
        label={translate('accountTab.emailAddress')}
        placeholder={translate('accountTab.emailAddress')}
        fullWidth
        error={!!errorMessage}
        bottomMessageProps={{
          className: clsx(classes.BottomMessage, {
            [classes.BottomMessage_error]: errorMessage,
          }),
        }}
        {...(showBottomMessage && {
          bottomMessage:
            errorMessage ||
            (emailVerified ? (
              <SuccessMessage
                message={translate('accountTab.emailHasBeenVerified')}
              />
            ) : (
              successMessage
            )),
        })}
        onKeyDown={event => {
          if (event.keyCode === 13) {
            event.preventDefault()
            determineOnClick(event)
          }
        }}
        {...(profileSettings?.maskSensitiveData && {
          endAdornment: (
            <VisibilityButton
              showSlashIcon={showSensitiveData}
              onClick={() => setShowSensitiveData(!showSensitiveData)}
            />
          ),
        })}
      />

      <div
        className={clsx(classes.GeneralTab__actions, {
          [classes.GeneralTab__actions_alignCenter]: showBottomMessage,
        })}
      >
        <Button
          className={classes.GeneralTab__button}
          borderOutline
          color="primary"
          variant="contained"
          ref={updateEmailButtonRef}
          loading={busy}
          loadingProps={{ widthAndHeight: 30 }}
          disabled={busy || email.length <= 3 || emailVerified || verifying}
          onClick={determineOnClick}
          fullWidth={!isTabletOrDesktop}
          sx={{ height: '44px' }}
          label={translate('accountTab.verify')}
        />
      </div>
    </>
  )
}
