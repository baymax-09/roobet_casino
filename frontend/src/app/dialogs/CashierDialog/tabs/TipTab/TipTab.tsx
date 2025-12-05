import React from 'react'
import { InputAdornment, FormControl, useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import { usePopupState } from 'material-ui-popup-state/hooks'
import {
  InputField,
  Checkbox,
  FormControlLabel,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'

import { sendTip } from 'app/lib/user'
import {
  useTranslate,
  useCashierOptions,
  useCurrencyFormatter,
  useCurrencyUnexchange,
  useCurrencyDisplay,
} from 'app/hooks'
import { useToasts } from 'common/hooks'
import { TwoFactorCodeDialog } from 'app/dialogs/TwoFactorCodeDialog'

import { TabTemplate, BlockTemplate, BalanceDropdown } from '../../templates'
import { useCryptoWithdrawOptionStyles } from '../WithdrawTab/hooks'

interface Message {
  text: string
  type: 'error' | 'info'
}

const DEFAULT_MESSAGE = {
  text: '',
  type: 'info',
} as const

interface TipTabProps {
  params: Record<string, string>
}

export const TipTab: React.FC<TipTabProps> = React.memo(({ params }) => {
  const cryptoWithdrawOptionClasses = useCryptoWithdrawOptionStyles()
  const translate = useTranslate()
  const exchangeAndFormatCurrency = useCurrencyFormatter()
  const displayCurrencyExchange = useCurrencyDisplay()
  const unexchangeCurrency = useCurrencyUnexchange()
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const { toast } = useToasts()

  const [username, setUsername] = React.useState(params.username || '')
  const [amount, setAmount] = React.useState('')
  const [isPublic, setPublic] = React.useState(false)
  const [message, setMessage] = React.useState<Message>(DEFAULT_MESSAGE)
  const [busy, setBusy] = React.useState(false)
  const [sendTipButtonEnabled, setSendTipButtonEnabled] = React.useState(false)

  const usernameRef = React.useRef<HTMLInputElement>()
  const amountRef = React.useRef<HTMLInputElement>()
  const tipButtonRef = React.useRef<HTMLButtonElement>()
  const formRef = React.useRef<HTMLFormElement | null>(null)

  const twoFactorEnabled = useSelector(({ user }) => {
    return !!user && user.twofactorEnabled && !user.specialTipSender
  })

  const { allCashierOptions } = useCashierOptions()

  const selectedBalanceType = useSelector(
    ({ balances }) =>
      balances?.selectedBalanceType || allCashierOptions[0].balanceType,
  )

  const selectedCashierOption =
    allCashierOptions.find(
      option => option.balanceType === selectedBalanceType,
    ) ?? allCashierOptions[0]

  const twoFactorPopupState = usePopupState({
    variant: 'popover',
    popupId: 'twoFactorPopover',
  })

  const {
    currencySymbol: preferredCurrencySymbol,
    exchangedAmount: placeholderAmount,
  } = displayCurrencyExchange(5)

  const onSendTip = React.useCallback(
    (event, twoFactorToken = null) => {
      if (!sendTipButtonEnabled) {
        return
      }
      if (!username.length) {
        usernameRef.current?.focus()
        return
      } else if (!amount.length) {
        amountRef.current?.focus()
        return
      }

      const parsedAmount = parseFloat(amount.replace(/,/g, ''))
      const backConvertedAmount = unexchangeCurrency(parsedAmount).toString()

      if (!twoFactorToken && twoFactorEnabled) {
        twoFactorPopupState.open()
        return
      }

      setBusy(true)
      setMessage({ text: '', type: 'info' })

      const isPrivate = !isPublic

      sendTip(username, backConvertedAmount, isPrivate, twoFactorToken)
        .then(
          () => {
            setUsername('')
            setMessage({
              text: translate('tipTab.yourTipHasBeenSent!'),
              type: 'info',
            })
            twoFactorPopupState.close()

            if (usernameRef.current) {
              usernameRef.current.focus()
            }
          },
          err => {
            toast.error(err)
          },
        )
        .finally(() => setBusy(false))
    },
    [
      setBusy,
      setMessage,
      setUsername,
      username,
      amount,
      isPublic,
      twoFactorEnabled,
      twoFactorPopupState,
      unexchangeCurrency,
      translate,
      sendTipButtonEnabled,
      toast,
    ],
  )

  const onTwoFactorConfirm = React.useCallback(
    twoFactorToken => onSendTip(null, twoFactorToken),
    [onSendTip],
  )
  const onIsPrivateChange = React.useCallback(
    event => setPublic(event.target.checked),
    [],
  )
  const onAmountChange = React.useCallback(
    event => setAmount(event.target.value),
    [],
  )
  const onUsernameChange = React.useCallback(
    event => setUsername(event.target.value),
    [],
  )

  const filteredCashierOptions = allCashierOptions.filter(
    option => option.canTip,
  )

  // Enable "Send Tip" button when form is valid.
  React.useEffect(() => {
    if (formRef.current) {
      const isValid = formRef.current.checkValidity()
      if (isValid) {
        setSendTipButtonEnabled(true)
        return
      }
      if (!isValid && sendTipButtonEnabled) {
        setSendTipButtonEnabled(false)
      }
    }
  }, [username, amount, sendTipButtonEnabled])

  const sendTipDisabled = busy || !sendTipButtonEnabled

  return (
    <TabTemplate
      buttonRef={tipButtonRef}
      buttonProps={{
        label: translate('tipTab.sendTip'),
        disabled: sendTipDisabled || busy,
        onClick: onSendTip,
        loading: busy,
      }}
      {...(message.text && {
        explainerProps: {
          message: message.text,
          error: message.type === 'error',
        },
      })}
    >
      <BlockTemplate>
        <BalanceDropdown
          disabled={busy}
          customCashierOptions={filteredCashierOptions}
          selectedCashierOption={selectedCashierOption}
        />
        {/** TODO: Rework and use Formik */}
        <form ref={formRef} className={cryptoWithdrawOptionClasses.Form}>
          <InputField
            inputProps={{
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
            }}
            autoComplete="off"
            disabled={busy}
            color="secondary"
            size="small"
            inputRef={usernameRef}
            autoFocus={isDesktop && !username.length}
            required
            fullWidth
            label={translate('tipTab.username')}
            value={username}
            onChange={onUsernameChange}
            placeholder={translate('tipTab.enterUsername')}
          />
          <InputField
            autoComplete="off"
            color="secondary"
            autoFocus={isDesktop && username.length > 0}
            disabled={busy}
            size="small"
            type="number"
            inputProps={{
              min: 0,
              step: 0.01,
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
            }}
            inputRef={amountRef}
            required
            fullWidth
            label={translate('tipTab.tipAmount')}
            bottomMessage={translate('tipTab.convertedBalanceRequirementText', {
              minimum: exchangeAndFormatCurrency(10),
            })}
            value={amount}
            onChange={onAmountChange}
            placeholder={placeholderAmount.toFixed(2)}
            startAdornment={
              <InputAdornment disableTypography position="start">
                <Typography
                  color={uiTheme.palette.neutral[300]}
                  variant="body1"
                >
                  {preferredCurrencySymbol}
                </Typography>
              </InputAdornment>
            }
          />
          <FormControl variant="standard" disabled={busy}>
            <FormControlLabel
              control={
                <Checkbox
                  widthAndHeight={20}
                  required
                  checked={isPublic}
                  onChange={onIsPrivateChange}
                />
              }
              required={false}
              disabled={busy}
              label={translate('tipTab.showTipInChat')}
            />
          </FormControl>
        </form>
      </BlockTemplate>
      {/* Wrapping dialog in a display none div because the dialogs are leaving
          an empty div on the layout which leaves an empty gap in a flex box. */}
      <div className={cryptoWithdrawOptionClasses.Dialog}>
        <TwoFactorCodeDialog
          DialogProps={{
            open: twoFactorPopupState.isOpen,
            onClose: () => {
              twoFactorPopupState.close()
              setBusy(false)
            },
          }}
          data={{
            onSubmit: onTwoFactorConfirm,
            title: translate('tipTab.tip'),
            busy,
          }}
        />
      </div>
    </TabTemplate>
  )
})
