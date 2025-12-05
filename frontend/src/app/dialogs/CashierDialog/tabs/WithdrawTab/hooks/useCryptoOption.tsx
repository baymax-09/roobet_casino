import React from 'react'
import { useSelector } from 'react-redux'
import { InputAdornment } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type PopupState } from 'material-ui-popup-state/core'
import { useQuery } from '@apollo/client'
import { InputField, Typography, theme as uiTheme } from '@project-atl/ui'

import {
  useCurrencyUnexchange,
  useCurrencyFormatter,
  useCurrencyDisplay,
  useTranslate,
  useCashierOptions,
} from 'app/hooks'
import { type CryptoOption, CryptoOptions, hasCryptoTag } from 'app/constants'
import { api, exists } from 'common/util'
import {
  type WithdrawalFeeQueryVariables,
  type WithdrawalFeeQueryData,
  WithdrawalFeeQuery,
} from 'app/gql'
import { BalanceDropdown } from 'app/dialogs/CashierDialog/templates'
import { useToasts } from 'common/hooks'

interface UseCryptoOptionsArgs {
  isSmall?: boolean
  twoFactorPopupState: PopupState
  withdrawRoute: 'transfer' | 'new'
  skipFeeQuery?: boolean
  customCryptoOption?: CryptoOption
  hideDropdownBalance?: boolean
}

interface CryptoOptionsState {
  address: string
  tag?: string
  amount: string
  priority: 'low' | 'medium' | 'high' | 'fee'
  busy: boolean
  error?: Error
  message?: string
}

export const useCryptoWithdrawOptionStyles = makeStyles(() =>
  createStyles({
    Form: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },

    PreferredCurrencySymbol: {
      color: uiTheme.palette.neutral[300],
    },

    Dialog: {
      display: 'none',
    },
  }),
)

export const useCryptoWithdrawOption = ({
  isSmall,
  twoFactorPopupState,
  withdrawRoute,
  skipFeeQuery = false,
  customCryptoOption = undefined,
  hideDropdownBalance = false,
}: UseCryptoOptionsArgs) => {
  const classes = useCryptoWithdrawOptionStyles()
  const translate = useTranslate()
  const unexchangeCurrency = useCurrencyUnexchange()
  const displayCurrencyExchange = useCurrencyDisplay()
  const exchangeAndFormatCurrency = useCurrencyFormatter()
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const { toast } = useToasts()

  const [state, setState] = React.useState<CryptoOptionsState>({
    address: '',
    amount: '',
    priority: 'high',
    tag: undefined,
    busy: false,
    error: undefined,
    message: undefined,
  })
  const [withdrawalEnabled, setWithdrawalEnabled] = React.useState(false)
  const [cryptoWithdrawOption, setCryptoWithdrawOption] =
    React.useState<CryptoOption>(customCryptoOption ?? CryptoOptions[0])

  React.useEffect(() => {
    setCryptoWithdrawOption(customCryptoOption ?? CryptoOptions[0])
  }, [customCryptoOption])

  // Enable "Withdrawal" button when form is valid.
  React.useEffect(() => {
    if (formRef.current) {
      const isValid = formRef.current.checkValidity()
      if (isValid) {
        setWithdrawalEnabled(true)
        return
      }
      if (!isValid && withdrawalEnabled) {
        setWithdrawalEnabled(false)
      }
    }
  }, [state])

  const twoFactorEnabled = useSelector(({ user }) => user?.twofactorEnabled)

  const tagRef = React.useRef<
    Partial<Record<CryptoOption['balanceType'], HTMLInputElement>>
  >({})
  const amountRef = React.useRef<
    Partial<Record<CryptoOption['balanceType'], HTMLInputElement>>
  >({})
  const addressRef = React.useRef<
    Partial<Record<CryptoOption['balanceType'], HTMLInputElement>>
  >({})

  const { currencySymbol: preferredCurrencySymbol, exchangedAmount } =
    displayCurrencyExchange(0)

  const { cryptoOptions } = useCashierOptions({ cashierWalletNames: true })

  const hasAmountError = React.useMemo(() => {
    return (
      state.amount.length > 0 &&
      (Number.isNaN(state.amount) ||
        unexchangeCurrency(parseFloat(state.amount)) <
          cryptoWithdrawOption.minimumDeposit)
    )
  }, [state.amount, cryptoWithdrawOption, unexchangeCurrency])

  const { data, loading } = useQuery<
    WithdrawalFeeQueryData,
    WithdrawalFeeQueryVariables
  >(WithdrawalFeeQuery, {
    onError: error => {
      setState(prevState => ({ ...prevState, error }))
    },
    skip: skipFeeQuery,
    variables: {
      crypto: cryptoWithdrawOption.shortCode,
    },
  })

  const fee = loading || !data ? 0 : data.withdrawalFee.fee

  const handleWithdrawOptionChange = React.useCallback(event => {
    const withdrawOption = CryptoOptions.find(
      crypto => crypto.balanceType === event.target.value,
    )

    if (withdrawOption) {
      setCryptoWithdrawOption(withdrawOption)
    }
  }, [])

  const onWithdraw = React.useCallback(
    (evt, twoFactorToken = undefined) => {
      if (!withdrawalEnabled) {
        return
      }
      if (!state.address.length) {
        addressRef.current[cryptoWithdrawOption.balanceType]?.focus()
        return
      } else if (!state.amount?.length || hasAmountError) {
        amountRef.current[cryptoWithdrawOption.balanceType]?.focus()
        return
      }

      setState(prevState => ({ ...prevState, message: undefined }))
      const parsedAmount = parseFloat(state.amount.replace(/,/g, ''))
      const backConvertedAmount = unexchangeCurrency(parsedAmount)

      if (!twoFactorToken && twoFactorEnabled) {
        twoFactorPopupState.open()
        return
      }

      setState(prevState => ({ ...prevState, busy: true, error: undefined }))

      const headers = {
        'X-Seon-Session-Payload': window.seonSessionPayload || '',
      }
      const fields = {
        address: state.address,
        ...(state?.tag && { tag: state?.tag }),
        ...(withdrawRoute === 'transfer' && {
          priority:
            cryptoWithdrawOption.balanceType === 'crypto'
              ? state.priority
              : undefined,
        }),
      }

      api
        .post(
          `/withdraw/${withdrawRoute}`,
          {
            twoFactorToken,
            amount: backConvertedAmount,
            plugin: cryptoWithdrawOption.plugin,
            fields,
          },
          { headers },
        )
        .then(() => {
          window.dataLayer.push({
            withdrawalAmount: backConvertedAmount,
            event: 'withdrawal',
          })
          setState(prevState => ({
            ...prevState,
            message: translate('withdrawTab.withdrawQueued'),
          }))
          twoFactorPopupState.close()
        })
        .catch(error => {
          // Error shown while 2FA is open.
          toast.error(error.response ? error.response.data : error.message)
        })
        .finally(() => {
          setState(prevState => ({ ...prevState, busy: false }))
        })
    },
    [
      state.address,
      state.amount,
      cryptoWithdrawOption.balanceType,
      cryptoWithdrawOption.plugin,
      hasAmountError,
      state.priority,
      twoFactorEnabled,
      twoFactorPopupState,
      unexchangeCurrency,
      withdrawRoute,
      toast,
    ],
  )

  const handleAmount = React.useCallback(
    event =>
      setState(prevState => ({ ...prevState, amount: event.target.value })),
    [],
  )
  const onAddressChange = React.useCallback(
    event =>
      setState(prevState => ({ ...prevState, address: event.target.value })),
    [],
  )
  const onTagChange = React.useCallback(
    event => setState({ ...state, tag: event.target.value }),
    [state],
  )

  const updateAddressRef = React.useCallback(
    el => {
      addressRef.current[cryptoWithdrawOption.balanceType] = el
    },
    [cryptoWithdrawOption.balanceType],
  )
  const updateTagRef = React.useCallback(
    el => {
      tagRef.current[cryptoWithdrawOption.balanceType] = el
    },
    [cryptoWithdrawOption.balanceType],
  )
  const updateAmountRef = React.useCallback(
    event => {
      amountRef.current[cryptoWithdrawOption.balanceType] = event
    },
    [cryptoWithdrawOption.balanceType],
  )

  const fields = [
    !customCryptoOption ? (
      <BalanceDropdown
        selectedCashierOption={cryptoWithdrawOption}
        disabled={state.busy}
        onChange={handleWithdrawOptionChange}
        customCashierOptions={cryptoOptions}
        hideBalance={hideDropdownBalance}
      />
    ) : undefined,
    <InputField
      autoComplete="off"
      inputProps={{
        'data-lpignore': 'true',
        'data-1p-ignore': 'true',
      }}
      key="address"
      color="secondary"
      inputRef={updateAddressRef}
      disabled={state.busy}
      size="small"
      autoFocus={!isSmall}
      required
      fullWidth
      label={translate('withdrawTab.yourWalletAddress', {
        crypto: cryptoWithdrawOption.shortCode.toUpperCase(),
      })}
      value={state.address}
      onChange={onAddressChange}
      placeholder={translate('withdrawTab.yourAddress')}
    />,
    hasCryptoTag(cryptoWithdrawOption.shortCode) ? (
      <InputField
        autoComplete="off"
        inputProps={{
          'data-lpignore': 'true',
          'data-1p-ignore': 'true',
        }}
        key="tag"
        inputRef={updateTagRef}
        disabled={state.busy}
        size="small"
        autoFocus={!isSmall}
        fullWidth
        label={`${cryptoWithdrawOption.walletTag} (Optional)`}
        value={state.tag}
        onChange={onTagChange}
        placeholder={translate('withdrawTab.yourDestinationTag')}
        color="secondary"
      />
    ) : undefined,
    <InputField
      autoComplete="off"
      key="amount"
      color="secondary"
      inputRef={updateAmountRef}
      disabled={state.busy}
      error={hasAmountError}
      size="small"
      required
      fullWidth
      label={translate('withdrawTab.withdrawalAmount')}
      value={state.amount}
      onChange={handleAmount}
      type="number"
      inputProps={{
        min: 0,
        step: 0.01,
        'data-lpignore': 'true',
        'data-1p-ignore': 'true',
      }}
      placeholder={exchangedAmount.toFixed(2)}
      startAdornment={
        <InputAdornment disableTypography position="start">
          <Typography color={uiTheme.palette.neutral[300]} variant="body1">
            {preferredCurrencySymbol}
          </Typography>
        </InputAdornment>
      }
      bottomMessage={translate('withdrawTab.minimumWithdrawalText', {
        minWithdraw: exchangeAndFormatCurrency(
          cryptoWithdrawOption.minimumDeposit,
        ),
      })}
    />,
    cryptoWithdrawOption.balanceType === 'trx' ? (
      <Typography variant="body4">
        {translate('withdrawTab.minimumTronWithdrawalFeeText')}
      </Typography>
    ) : undefined,
    /* eslint-disable no-constant-condition */
    // ['balance', 'ltcBalance'].includes(cryptoWithdrawOption.balanceType) &&
    // false ? (
    //   <FormControl fullWidth>
    //     <InputLabel>{translate('withdrawTab.priority')}</InputLabel>
    //     <Select value={state.priority || ''} onChange={handlePriority}>
    //       <MenuItem value="low">{translate('withdrawTab.low')}</MenuItem>
    //       <MenuItem value="medium">{translate('withdrawTab.medium')}</MenuItem>
    //       <MenuItem value="high">{translate('withdrawTab.high')}</MenuItem>
    //     </Select>
    //   </FormControl>
    // ) : null,
  ].filter(exists)

  const actions = [
    <Typography
      variant="body4"
      fontWeight={uiTheme.typography.fontWeightBold}
      textAlign="center"
    >
      {fee === 0
        ? exchangeAndFormatCurrency(fee, '0.00')
        : cryptoWithdrawOption.balanceType === 'xrp'
          ? exchangeAndFormatCurrency(fee, '0,0.000000')
          : exchangeAndFormatCurrency(fee, '0,0.00')}{' '}
      {translate('withdrawTab.estimatedTransactionFee')}
    </Typography>,
  ] as const

  return {
    actions,
    fields: (
      <form ref={formRef} className={classes.Form}>
        {fields}
      </form>
    ),
    onWithdraw,
    error: state.error,
    message: state.message,
    busy: state.busy,
    withdrawalEnabled,
  }
}
