import React from 'react'
import { Helmet } from 'react-helmet'
import {
  Button,
  Typography,
  theme as uiTheme,
  InputField,
  Explainer,
} from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'
import { type DialogProps } from 'app/types'
import { api } from 'common/util'
import { Skeleton } from 'mrooi'
import { setUser } from 'app/reducers/user'
import { store } from 'app/util'
import { useToasts } from 'common/hooks'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useTwoFactorConfirmDialogStyles } from './TwoFactorConfirmDialog.styles'

export interface Requested2FA {
  dataUrl: string
  secret: string
}

interface TwoFactorConfirmDialogViewProps {
  DialogProps: DialogProps
  params: {
    isEmail: boolean
  }
}

const TwoFactorConfirmDialogView: React.FC<TwoFactorConfirmDialogViewProps> = ({
  DialogProps,
  params,
}) => {
  const { isEmail = false } = params
  const { toast } = useToasts()

  const [requested2FA, setRequested2FA] = React.useState<Requested2FA | null>(
    null,
  )
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const [code, setCode] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [explainerMessage, setExplainerMessage] = React.useState({
    message: '',
    error: false,
  })

  const translate = useTranslate()
  const classes = useTwoFactorConfirmDialogStyles()

  const update2FA = async twoFactorToken => {
    setExplainerMessage({ message: '', error: false })
    setBusy(true)

    try {
      const response = await api.post<
        { userToken: string },
        { success: boolean }
      >('/auth/verify2fa', {
        userToken: parseInt(twoFactorToken),
      })

      if (!response.success) {
        setExplainerMessage({
          message: translate('securityTab.incorrectToken'),
          error: true,
        })
        return
      }

      store.dispatch(setUser({ twofactorEnabled: true }))
      toast.success(translate('securityTab.enabled'))
      DialogProps.onClose()
    } catch (err) {
      return Promise.reject(err)
    } finally {
      setBusy(false)
    }
  }

  const submit = React.useCallback(() => {
    setExplainerMessage({ message: '', error: false })
    setBusy(true)

    update2FA(code).then(
      () => {},
      err => {
        setExplainerMessage({
          message: err.response ? err.response.data : err.message,
          error: true,
        })
        setBusy(false)
      },
    )
  }, [code])

  React.useEffect(() => {
    if (requested2FA) {
      return
    }

    const request2FA = async () => {
      try {
        const response = await api.post<any, { secret: Requested2FA }>(
          '/auth/set2fa',
        )
        setRequested2FA(response.secret)
        setBusy(false)
      } catch (err) {}
    }

    setBusy(true)
    request2FA()
  }, [setRequested2FA, requested2FA])

  const submitWithEnter = React.useCallback(
    ev => {
      if (
        ev.KeyCode === 13 ||
        ev.code === 'Enter' ||
        ev.code === 'NumpadEnter'
      ) {
        ev.preventDefault()
        submit()
      }
    },
    [submit],
  )

  const title = translate('twoFactorConfirmDialog.enable2FA')

  return (
    <DialogWithBottomNavigation
      {...DialogProps}
      className={classes.TwoFactorConfirmDialog}
      maxWidth="md"
      fullWidth
      showCloseInTitle
      title={title}
      handleClose={DialogProps.onClose}
    >
      <Helmet title={title} />
      <div className={classes.TwoFactorConfirmDialog__content}>
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate('twoFactorConfirm.about2fa')}
        </Typography>

        <div className={classes.QRContainer}>
          {requested2FA ? (
            <div className={classes.QR}>
              <img
                className={classes.QR__image}
                alt="qr code"
                src={requested2FA.dataUrl}
              />
            </div>
          ) : (
            <Skeleton variant="rectangular" width="8rem" height="8rem" />
          )}
        </div>

        <div className={classes.InputsContainer}>
          {/* TFA Secret */}
          <InputField
            color="secondary"
            disabled={busy}
            size="medium"
            fullWidth
            inputProps={{
              readOnly: true,
            }}
            label={translate('twoFactorConfirm.2faSecret')}
            value={requested2FA ? requested2FA.secret : ''}
            placeholder="twoFactorConfirm.loading"
          />

          {!isEmail && (
            <Typography
              variant="body2"
              color={uiTheme.palette.neutral[400]}
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {translate('twoFactorConfirm.enterSixDigitCode')}
            </Typography>
          )}
          {isEmail && (
            <Typography
              variant="body2"
              color={uiTheme.palette.neutral[400]}
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {translate('twoFactorConfirm.emailedSixDigitCode')}
            </Typography>
          )}

          {/* TFA Code Input */}
          <InputField
            color="secondary"
            type="number"
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={busy}
            size="medium"
            error={!!explainerMessage.error}
            autoFocus={isTabletOrDesktop}
            required
            fullWidth
            label={translate('twoFactorConfirm.2faCode')}
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder={translate('twoFactorConfirm.enter2faCode')}
            onKeyDown={submitWithEnter}
          />
        </div>

        <div className={classes.ButtonContainer}>
          <Button
            className={classes.ButtonContainer__button}
            onClick={() => DialogProps.onClose()}
            size="large"
            variant="text"
            label={translate('twoFactorConfirm.cancel')}
          />
          <Button
            className={classes.ButtonContainer__button}
            loading={busy}
            disabled={code.length < 6 || busy}
            onClick={submit}
            size="large"
            color="primary"
            variant="contained"
            label={translate('twoFactorConfirm.continue')}
            borderOutline
          />
        </div>
      </div>
      {explainerMessage.message && (
        <Explainer
          message={explainerMessage.message}
          error={explainerMessage.error}
        />
      )}
    </DialogWithBottomNavigation>
  )
}

export const TwoFactorConfirmDialog = React.memo(TwoFactorConfirmDialogView)
