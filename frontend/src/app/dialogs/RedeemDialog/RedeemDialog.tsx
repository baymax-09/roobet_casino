import React from 'react'
import clsx from 'clsx'
import {
  useMediaQuery,
  type DialogProps as MuiDialogProps,
} from '@mui/material'
import { Helmet } from 'react-helmet'
import ReCaptcha from 'react-google-recaptcha'
import {
  InputField,
  Typography,
  Button,
  theme as uiTheme,
  type DialogProps as UxDialogProps,
} from '@project-atl/ui'

import { isMobile } from 'app/util'
import { useToasts } from 'common/hooks'
import { type RedeemResponse } from 'common/types'
import { LoginOverlay, type LoginOverlayProps } from 'mrooi'
import {
  useCashierOptions,
  useCurrencyFormatter,
  useDialogsLinkUpdate,
  useIsLoggedIn,
  useTranslate,
} from 'app/hooks'
import { redeemCode } from 'app/lib/user'
import redeemSlotMachine from 'assets/images/slotMachine777.png'
import { getCachedSrc } from 'common/util'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useRedeemStyles } from './RedeemDialog.styles'

export interface RedeemDialogProps {
  DialogProps: UxDialogProps & MuiDialogProps
  params: LoginOverlayProps
}

export const RedeemDialog: React.FC<RedeemDialogProps> = props => {
  const classes = useRedeemStyles()
  const translate = useTranslate()
  const { toast } = useToasts()
  const currencyFormatter = useCurrencyFormatter()
  const { cryptoOptions } = useCashierOptions()

  const isLoggedIn = useIsLoggedIn()

  const recaptchaRef = React.useRef<InstanceType<typeof ReCaptcha>>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const codeRef = React.useRef<HTMLInputElement | null>(null)

  const [busy, setBusy] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState(null)
  const [code, setCode] = React.useState('')

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  useDialogsLinkUpdate()

  const setCodeFocus = () => {
    if (codeRef.current) {
      codeRef.current.focus()
      codeRef.current.setSelectionRange(0, codeRef.current.value.length)
    }
  }

  const onClaim = () => {
    if ((codeRef.current?.value.length || 0) < 1) {
      setCodeFocus()
      setBusy(false)
      setErrorMessage(translate('promoPanel.enterACode'))
      return
    }

    setCodeFocus()
    setBusy(true)
    setErrorMessage(null)
    recaptchaRef.current?.execute()
  }

  const getMessage = (response: RedeemResponse): string => {
    if (response.redeemed) {
      const amount: number = response.amount!
      const amountType: string = response.amountType!
      const isCash = amountType === 'cash'
      const matchingWallet = isCash
        ? { walletName: translate('cashier.cash') }
        : cryptoOptions.filter(opt => opt.balanceType === amountType)[0]

      return translate('promoPanel.redeemBalanceSuccessText', {
        amount: currencyFormatter(amount),
        amountType: matchingWallet.walletName,
      })
    }
    return translate('promoPanel.redeemBonusSuccessText')
  }

  const claimCode = recaptcha => {
    recaptchaRef.current?.reset()

    redeemCode(code, recaptcha).then(
      response => {
        const message = getMessage(response)
        toast.success(message)
        closeDialog()
        setCode('')
        setBusy(false)
      },
      err => {
        setBusy(false)
        setCodeFocus()
        setErrorMessage(err)
      },
    )
  }

  const updateCode = code => {
    setCode(code)
    setErrorMessage(null)
  }

  const closeDialog = () => {
    if (props && props.DialogProps.onClose) {
      props.DialogProps.onClose({}, 'escapeKeyDown')
    }
  }

  const hasError = !!errorMessage
  const inputErrorProps = {
    error: hasError,
    ...(hasError ? { bottomMessage: errorMessage } : {}),
  }

  return (
    <DialogWithBottomNavigation
      className={classes.RedeemDialog}
      maxWidth="md"
      fullWidth
      showCloseInTitle={true}
      handleClose={closeDialog}
      {...props.DialogProps}
      title={translate('promoTab.title')}
    >
      <>
        <Helmet title={translate('promoTab.title')} />
        {!isLoggedIn && <LoginOverlay {...props.params} dialog="redeem" />}
        <div className={classes.Redeem}>
          <img
            className={classes.Redeem__slotMachine}
            src={getCachedSrc({ src: redeemSlotMachine, width: 400 })}
            alt="Slot Machine"
          />
          <div className={classes.Redeem__writtenContent}>
            <div className={classes.Redeem__messageContent}>
              <Typography
                variant="h5"
                fontWeight={uiTheme.typography.fontWeightBlack}
              >
                {translate('promoTab.heading')}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={uiTheme.typography.fontWeightMedium}
                color={uiTheme.palette.neutral[300]}
              >
                {translate('promoTab.subHeading')}
              </Typography>
            </div>
            <div
              className={clsx(classes.Redeem__form, {
                [classes.blurred]: !isLoggedIn,
              })}
            >
              <InputField
                className={classes.Redeem__formInput}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    onClaim()
                  }
                }}
                inputRef={codeRef}
                disabled={busy || !isLoggedIn}
                size="small"
                autoFocus={!isMobile()}
                required
                fullWidth
                label={translate('promoPanel.promotionalCode')}
                value={code}
                onChange={event => updateCode(event.target.value)}
                placeholder={translate('promoPanel.enterACode')}
                {...inputErrorProps}
              />
              {isTabletOrDesktop && (
                <Button
                  className={classes.Redeem__formButton}
                  ref={buttonRef}
                  disabled={busy}
                  onClick={onClaim}
                  color="primary"
                  variant="contained"
                  size="large"
                  label={translate('promoPanel.redeemPromotion')}
                />
              )}
            </div>
            <ReCaptcha
              ref={recaptchaRef}
              size="invisible"
              sitekey="6LcyLZQUAAAAALOaIzlr4pTcnRRKEQn-d6sQIFUx"
              onErrored={() => {
                setErrorMessage(translate('promoPanel.recaptchaErrorText'))
              }}
              onChange={claimCode}
            />
          </div>
        </div>
        {!isTabletOrDesktop && (
          <div className={classes.Redeem__formMobileContainer}>
            <Button
              className={classes.Redeem__formMobileButton}
              ref={buttonRef}
              disabled={busy}
              onClick={onClaim}
              color="primary"
              variant="contained"
              size="extraLarge"
              fullWidth
              label={translate('promoPanel.redeemPromotion')}
            />
          </div>
        )}
      </>
    </DialogWithBottomNavigation>
  )
}
