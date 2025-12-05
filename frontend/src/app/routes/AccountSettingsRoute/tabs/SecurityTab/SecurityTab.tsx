import React from 'react'
import { useSelector } from 'react-redux'
import { useIntercom } from 'react-use-intercom'
import {
  InputField,
  Button,
  Typography,
  theme as uiTheme,
  Link,
} from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { defaultSocket } from 'app/lib/sockets'
import { endSession } from 'app/lib/user'
import { setUser } from 'app/reducers/user'
import { store } from 'app/util'
import { api } from 'common/util'
import { useDialogsOpener, useTranslate } from 'app/hooks'
import { SessionsDialog } from 'app/dialogs/SessionsDialog'
import { TwoFactorCodeDialog } from 'app/dialogs/TwoFactorCodeDialog'
import { useAxiosPost, useToasts } from 'common/hooks'

import { InfoBlock } from '../common'

import { useSecurityTabStyles } from './SecurityTab.styles'

interface SecurityTabProps {
  params?: {
    showSessions?: string
  }
}

const SecurityTabView: React.FC<SecurityTabProps> = ({ params }) => {
  const classes = useSecurityTabStyles()
  const translate = useTranslate()
  const { shutdown } = useIntercom()
  const openDialog = useDialogsOpener()
  const { toast } = useToasts()
  const twofactorEnabled = useSelector(
    ({ user }) => user?.twofactorEnabled || false,
  )
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [busy, setBusy] = React.useState(false)
  const [showSessions, setShowSessions] = React.useState(() => {
    return params?.showSessions === 'yes'
  })
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showDialog, setShowDialog] = React.useState<
    'password' | 'disable2fa' | ''
  >('')

  const passwordRef = React.useRef<HTMLInputElement>(null)
  const confirmPasswordRef = React.useRef<HTMLInputElement>(null)

  const [changePasswordRequest, { loading: changingPassword }] = useAxiosPost(
    '/auth/setPassword',
    {
      onCompleted: async () => {
        if (password) {
          store.dispatch(
            setUser({
              setPassword: true,
            }),
          )
        }

        setPassword('')
        setShowDialog('')
        setConfirmPassword('password')
        showSuccess(translate('securityTab.passwordUpdateSuccessful'))
        shutdown()
        await defaultSocket._socket.connect()
        endSession(true, true)
      },
      onError: async err => {
        showError(
          // @ts-expect-error TODO Axios error interface
          err.response ? err.response.data : err.message,
        )
        await defaultSocket._socket.connect()
      },
    },
  )

  const rootRef = React.useRef<HTMLDivElement>(null)

  const showError = message => {
    setBusy(false)
    toast.error(message)
  }

  const showSuccess = message => {
    setBusy(false)
    toast.success(message)
  }

  const changePassword = async (twoFactorToken: string | null = null) => {
    if (!password.length) {
      passwordRef.current?.focus()
      return
    } else if (!confirmPassword.length) {
      confirmPasswordRef.current?.focus()
      return
    } else if (password !== confirmPassword) {
      showError(translate('securityTab.passwordsDoNotMatch'))
      return
    }

    if (twofactorEnabled && !twoFactorToken) {
      setShowDialog('password')
      return
    }

    // Disconnect from the socket so we don't get any messages while the password is being changed,
    // such as a force refresh.
    await defaultSocket._socket.disconnect()
    await changePasswordRequest({
      variables: {
        password,
        twoFactorToken,
      },
    })
  }

  const toggleTwoFactor = () => {
    if (twofactorEnabled) {
      setShowDialog('disable2fa')
    } else {
      openDialog('twoFactorConfirm', {
        params: { isEmail: false },
      })
    }
  }

  const update2FA = async twoFactorToken => {
    setBusy(true)

    try {
      const response = await api.post<
        { userToken: string },
        { success: boolean }
      >('/auth/disable2fa', {
        userToken: parseInt(twoFactorToken),
      })

      if (!response.success) {
        showError(translate('securityTab.incorrectToken'))
        return
      }

      setShowDialog('')
      showSuccess(translate('securityTab.disabled'))
      store.dispatch(setUser({ twofactorEnabled: false }))
    } catch (err) {
      return Promise.reject(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className={classes.AccountDialog__securityTab}>
      <InfoBlock title={translate('securityTab.changePassword')}>
        <div className={classes.PasswordInputsContainer}>
          <InputField
            color="secondary"
            autoComplete="new-password"
            id="security-tab-new-password"
            disabled={busy}
            type="password"
            fullWidth
            value={password}
            onChange={event => setPassword(event.target.value)}
            label={translate('securityTab.newPassword')}
            placeholder={translate('securityTab.newPassword')}
            inputRef={passwordRef}
            onKeyDown={event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                changePassword()
              }
            }}
          />

          <InputField
            color="secondary"
            autoComplete="new-password"
            id="security-tab-confirm-new-password"
            inputRef={confirmPasswordRef}
            disabled={busy}
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            label={translate('securityTab.confirmNewPassword')}
            placeholder={translate('securityTab.confirmNewPassword')}
            fullWidth
            onKeyDown={event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                changePassword()
              }
            }}
          />
        </div>
        <Button
          fullWidth={!isTabletOrDesktop}
          loading={changingPassword}
          disabled={
            changingPassword || !password.length || !confirmPassword.length
          }
          onClick={() => changePassword()}
          size="large"
          variant="contained"
          color="primary"
          borderOutline
          label={translate('securityTab.changePassword')}
        />
      </InfoBlock>

      <InfoBlock title={translate('securityTab.2fa')} size="small">
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
          paddingBottom={uiTheme.spacing(0.5)}
        >
          {translate('securityTab.enable2faDesc')}{' '}
          <Link
            fontWeight={uiTheme.typography.fontWeightBold}
            className={classes.Link}
            color="inherit"
            href="https://help.roobet.com/en/articles/5017812-2fa-guide"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            {translate('securityTab.enable2faLearnMore')}
          </Link>
        </Typography>
        <Button
          disabled={busy}
          variant="contained"
          color="tertiary"
          onClick={toggleTwoFactor}
          label={
            twofactorEnabled
              ? translate('securityTab.disable2fa')
              : translate('securityTab.enable2fa')
          }
        />
      </InfoBlock>

      <InfoBlock
        title={translate('securityTab.multiDeviceLayout')}
        size="small"
      >
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
          paddingBottom={uiTheme.spacing(0.5)}
        >
          {translate('securityTab.multiDeviceLayoutDesc')}
        </Typography>
        <div className={classes.SessionButtons}>
          <Button
            fullWidth={!isTabletOrDesktop}
            onClick={() => {
              setShowSessions(true)
            }}
            size="large"
            color="tertiary"
            variant="contained"
            label={translate('securityTab.viewRecentSessions')}
          />
          <Button
            fullWidth={!isTabletOrDesktop}
            disabled={busy}
            onClick={() => {
              shutdown()
              defaultSocket._socket.connect()
              endSession(true)
            }}
            size="large"
            variant="text"
            label={translate('securityTab.logoutEverywhere')}
          />
        </div>
      </InfoBlock>
      {/* Wrapping dialogs in a display none div because the dialogs are leaving
      an empty div on the layout which leaves an empty gap in a flex box. */}
      <div className={classes.dialogs}>
        <TwoFactorCodeDialog
          DialogProps={{
            open: showDialog,
            onClose: () => {
              setShowDialog('')
            },
          }}
          data={{
            onSubmit: (token: string) => {
              if (showDialog === 'password') {
                changePassword(token)
                return
              }
              if (showDialog === 'disable2fa') {
                update2FA(token)
              }
            },
            title:
              showDialog === 'password'
                ? translate('securityTab.changePassword')
                : showDialog === 'disable2fa'
                  ? translate('securityTab.disable2FATitle')
                  : translate('securityTab.code'),
            busy,
          }}
        />

        <SessionsDialog
          DialogProps={{
            open: showSessions,
            onClose: () => setShowSessions(false),
          }}
        />
      </div>
    </div>
  )
}

export const SecurityTab = React.memo(SecurityTabView)
