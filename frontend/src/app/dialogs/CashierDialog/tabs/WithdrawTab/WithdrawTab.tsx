import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { usePopupState } from 'material-ui-popup-state/hooks'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'
import { useHistory } from 'react-router'

import { useTranslate, useFeatures, useCashierOptions } from 'app/hooks'
import MailLogo from 'assets/icons/cashier/Mail.svg'
import { isCashOption as isCashOptionTypeGaurd } from 'app/constants'
import { ACCOUNT_SETTINGS_GENERAL_LINK } from 'app/routes/AccountSettingsRoute/constants/accountSettingsLinks'
import { TwoFactorCodeDialog } from 'app/dialogs/TwoFactorCodeDialog'

import { CashWithdrawOption } from './options'
import {
  BalanceDropdown,
  BlockTemplate,
  TabTemplate,
  RestrictedTemplate,
  DescriptionTemplate,
} from '../../templates'
import { useCryptoWithdrawOption, useCryptoWithdrawOptionStyles } from './hooks'

const WithdrawTab: React.FC = () => {
  const translate = useTranslate()
  const history = useHistory()
  const classes = useCryptoWithdrawOptionStyles()

  const buttonRef = React.useRef<HTMLDivElement>()

  const isVerified = useSelector(({ user }) => user?.emailVerified)
  const userId = useSelector(({ user }) => user?.id)
  const sessionId = useSelector(({ settings }) => settings?.sessionId || '')
  const balances = useSelector(({ balances }) => balances, shallowEqual)

  const [showWithdrawalButton, setShowWithdrawalButton] =
    React.useState<boolean>(false)
  const [withdrawalEnabled, setWithdrawalEnabled] = React.useState(false)

  const { allowed: isPaymentIQAllowed } = useFeatures(['paymentiq'])

  const { allCashierOptions } = useCashierOptions({ cashierWalletNames: true })

  const selectedWithdrawBalance =
    allCashierOptions.find(
      balanceData => balanceData.balanceType === balances.selectedBalanceType,
    ) || allCashierOptions[0]

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const isCashOption = isCashOptionTypeGaurd(selectedWithdrawBalance)

  const popoverText = isCashOption ? 'cash' : selectedWithdrawBalance.plugin

  const twoFactorPopupState = usePopupState({
    variant: 'popover',
    popupId: `twoFactorPopover-withdraw-${popoverText}`,
  })

  const {
    fields: cryptoFields,
    actions,
    onWithdraw,
    error,
    message,
    busy,
    withdrawalEnabled: withdrawalEnabledCryptoHook,
  } = useCryptoWithdrawOption({
    isSmall: !isTabletOrDesktop,
    twoFactorPopupState,
    ...(!isCashOption && {
      customCryptoOption: selectedWithdrawBalance,
    }),
    withdrawRoute: 'new',
  })

  // Please refactor hook
  const cashToCryptoOptions = useCryptoWithdrawOption({
    isSmall: !isTabletOrDesktop,
    twoFactorPopupState,
    withdrawRoute: 'transfer',
    hideDropdownBalance: true,
  })

  const withdrawalMethod = isCashOption
    ? cashToCryptoOptions.onWithdraw
    : onWithdraw

  const onTwoFactorConfirm = React.useCallback(
    twoFactorToken => withdrawalMethod(null, twoFactorToken),
    [withdrawalMethod],
  )

  const hideCashWithdraw = !isPaymentIQAllowed && balances.cash < 0.001

  const filteredCashierOptions = allCashierOptions.filter(
    option =>
      option.balanceType !== 'cash' ||
      (option.balanceType === 'cash' && !hideCashWithdraw),
  )

  React.useEffect(() => {
    if (!isCashOption && isVerified) {
      setShowWithdrawalButton(true)
    }
  }, [isCashOption, isVerified])

  React.useEffect(() => {
    setWithdrawalEnabled(withdrawalEnabledCryptoHook)
  }, [withdrawalEnabledCryptoHook])

  const withdrawalButtonDisabled =
    (isCashOption ? cashToCryptoOptions.busy : busy) || !withdrawalEnabled

  return (
    <TabTemplate
      {...(showWithdrawalButton && {
        buttonRef,
        buttonProps: {
          label: translate('withdrawTab.withdraw'),
          onClick: withdrawalMethod,
          disabled: withdrawalButtonDisabled || busy,
          loading: busy || cashToCryptoOptions.busy,
        },
        explainerProps: {
          message: isCashOption
            ? cashToCryptoOptions?.message ??
              cashToCryptoOptions.error?.message ??
              ''
            : message ?? error?.message ?? '',
          error:
            message || cashToCryptoOptions?.message
              ? false
              : isCashOption
                ? !!cashToCryptoOptions.error
                : !!error,
        },
        ...(isTabletOrDesktop && { aboveButtonComponent: actions }),
        ...(!isTabletOrDesktop && { belowButtonComponent: actions }),
      })}
    >
      {!isVerified ? (
        <RestrictedTemplate
          icon={MailLogo}
          title={translate('withdrawTab.confirmationRequired')}
          subtext={translate('withdrawTab.mustVerifyEmailText')}
          buttonProps={{
            label: translate('withdrawTab.verifyEmail'),
            onClick: () => {
              history.push(ACCOUNT_SETTINGS_GENERAL_LINK)
            },
          }}
        />
      ) : (
        <>
          <DescriptionTemplate title={translate('withdrawTab.selectWallet')} />
          <BlockTemplate>
            <BalanceDropdown
              customCashierOptions={filteredCashierOptions}
              selectedCashierOption={selectedWithdrawBalance}
            />
          </BlockTemplate>
          <DescriptionTemplate
            title={translate('withdrawTab.withdrawal')}
            {...(isCashOption && {
              subtext: translate('withdrawTab.selectDesiredMethod'),
            })}
          />
          {isCashOption ? (
            <CashWithdrawOption
              cashierOption={selectedWithdrawBalance}
              userId={userId}
              sessionId={sessionId}
              setShowWithdrawalButton={setShowWithdrawalButton}
              setWithdrawalEnabled={setWithdrawalEnabled}
              cashToCryptoOptions={cashToCryptoOptions}
            />
          ) : (
            <BlockTemplate>{cryptoFields}</BlockTemplate>
          )}
          {/* Wrapping dialog in a display none div because the dialogs are leaving
          an empty div on the layout which leaves an empty gap in a flex box. */}
          <div className={classes.Dialog}>
            <TwoFactorCodeDialog
              DialogProps={{
                open: twoFactorPopupState.isOpen,
                onClose: () => {
                  twoFactorPopupState.close()
                },
              }}
              data={{
                onSubmit: onTwoFactorConfirm,
                title: `${selectedWithdrawBalance.walletName} ${translate(
                  'withdrawTab.withdrawal',
                )}`,
                busy,
              }}
            />
          </div>
        </>
      )}
    </TabTemplate>
  )
}

export default React.memo(WithdrawTab)
