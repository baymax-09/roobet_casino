import React from 'react'
import { InputAdornment } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { useLazyQuery } from '@apollo/client'
import { shallowEqual, useSelector } from 'react-redux'
import { InputField, Typography, theme as uiTheme } from '@project-atl/ui'

import {
  useTranslate,
  useCurrencyFormatter,
  useCurrencyDisplay,
  useCurrencyUnexchange,
  useCashierOptions,
} from 'app/hooks'
import { env } from 'common/constants'
import {
  UserSystemStatusQuery,
  type UserSystemStatusQueryData,
  type UserSystemStatusQueryVars,
} from 'app/gql/systems'
import { truncateCurrency } from 'app/util'
import ApplePay from 'assets/icons/cashier/ApplePay.svg'
import Visa from 'assets/icons/cashier/Visa.svg'
import Mastercard from 'assets/icons/cashier/Mastercard.svg'
import GooglePay from 'assets/icons/cashier/GooglePay.svg'

import { RestrictedDepositTab } from '../DepositTab'
import {
  TabTemplate,
  BlockTemplate,
  DescriptionTemplate,
  BalanceDropdown,
} from '../../templates'

export const useBuyCryptoStyles = makeStyles(theme =>
  createStyles({
    PaymentIconsContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing(2.5),
    },
  }),
)

export const BuyCryptoTab: React.FC = () => {
  const classes = useBuyCryptoStyles()
  const translate = useTranslate()
  const exchangeAndFormatCurrency = useCurrencyFormatter()
  const displayCurrencyExchange = useCurrencyDisplay()
  const unexchangeCurrency = useCurrencyUnexchange()
  const { allCashierOptions } = useCashierOptions({ cashierWalletNames: true })

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const {
    currencySymbol: preferredCurrencySymbol,
    exchangedAmount: convertedInitial,
  } = displayCurrencyExchange(50)
  const [amount, setAmount] = React.useState<number>(
    Math.ceil(convertedInitial),
  )

  const userBalances = useSelector(({ balances }) => balances, shallowEqual)
  const userKYC = useSelector(
    ({ user }) => user?.kyc ?? { georestricted: false },
    shallowEqual,
  )
  const selectedBalanceType = userBalances?.selectedBalanceType

  const selectedCashierOption =
    allCashierOptions.find(
      option =>
        option.balanceType === selectedBalanceType &&
        // Cash should not be an option for the "Buy Crypto" tab
        selectedBalanceType !== 'cash',
    ) ?? allCashierOptions[0]

  const regionRestricted = useSelector(({ settings }) =>
    settings?.loaded ? settings?.restrictedRegion : undefined,
  )

  const [checkSystemStatus, { loading: checkSystemStatusLoading }] =
    useLazyQuery<UserSystemStatusQueryData, UserSystemStatusQueryVars>(
      UserSystemStatusQuery,
    )

  const openMoonpay = React.useCallback(() => {
    const moonPayBalanceType =
      selectedBalanceType === 'cash' ? 'crypto' : selectedBalanceType
    const backConvertedAmount = unexchangeCurrency(amount)
    const truncatedAmount = truncateCurrency(backConvertedAmount, 2)
    window.open(
      `${env.API_URL}/moonpay/getUrl?selectedBalanceType=${moonPayBalanceType}&amount=${truncatedAmount}&redirect=true`,
      '_blank',
    )
  }, [amount, selectedBalanceType, unexchangeCurrency])

  const startDeposit = React.useCallback(
    async ({ target }) => {
      const result = await checkSystemStatus({
        variables: {
          systemName: 'deposit',
        },
      })

      const { enabled, requiredKycLevel } = result.data?.userSystemStatus ?? {}

      if (!enabled) {
        const message = requiredKycLevel
          ? translate('buyCryptoTab.kycRequired', { level: requiredKycLevel })
          : translate('buyCryptoTab.disabled')

        setErrorMessage(message)
        return
      }

      // Else, redirect to Moonpay.
      openMoonpay()
    },
    [openMoonpay, checkSystemStatus, translate],
  )

  const onAmountChange = React.useCallback(
    event => setAmount(event.target.value),
    [],
  )

  return (
    <TabTemplate
      buttonProps={{
        label: translate('buyCryptoTab.buyCrypto'),
        disabled:
          unexchangeCurrency(amount) < 50 ||
          unexchangeCurrency(amount) > 12000 ||
          checkSystemStatusLoading,
        onClick: startDeposit,
        loading: checkSystemStatusLoading,
      }}
      {...(errorMessage && {
        explainerProps: {
          message: errorMessage,
          error: true,
        },
      })}
      belowButtonComponent={
        <div className={classes.PaymentIconsContainer}>
          <Visa />
          <GooglePay />
          <ApplePay />
          <Mastercard />
        </div>
      }
    >
      {regionRestricted || userKYC.georestricted ? (
        <RestrictedDepositTab />
      ) : (
        <>
          <DescriptionTemplate
            title={translate('buyCryptoTab.dontHaveCrypto')}
            subtext={translate('buyCryptoTab.completeSingleCheckout')}
          />
          <BlockTemplate>
            <BalanceDropdown
              disabled={checkSystemStatusLoading}
              selectedCashierOption={selectedCashierOption}
            />
            <InputField
              color="secondary"
              disabled={checkSystemStatusLoading}
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              required
              fullWidth
              bottomMessage={translate(
                'buyCryptoTab.convertedMinimumPurchaseAmount',
                {
                  minimum: exchangeAndFormatCurrency(50),
                },
              )}
              label={translate('buyCryptoTab.purchaseAmount')}
              value={amount}
              onChange={onAmountChange}
              placeholder={convertedInitial.toFixed(2)}
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
          </BlockTemplate>
        </>
      )}
    </TabTemplate>
  )
}
