import React, { type ElementRef } from 'react'
import clsx from 'clsx'
import { shallowEqual, useSelector } from 'react-redux'
import { usePopupState, bindPopover } from 'material-ui-popup-state/hooks'
import { useMediaQuery, type MenuProps } from '@mui/material'
import {
  Button,
  IconButton,
  Typography,
  ListItemIcon,
  theme as uiTheme,
  List,
  ListItemButton,
  ActionIcon,
  Popover,
} from '@project-atl/ui'
import { ChevronDown, ChevronUp, AccountSettings } from '@project-atl/ui/assets'

import BalancePlus from 'assets/icons/newDesignIcons/BalancePlus.svg'
import { useApp } from 'app/context'
import { getWalletImageUri, shouldHideBalance } from 'app/util'
import {
  useDialogsOpener,
  useTranslate,
  useCashierOptions,
  useFeatures,
} from 'app/hooks'
import { setBalanceType } from 'app/lib/user'
import { type BalanceType } from 'common/types'
import { Currency } from 'app/components/DisplayCurrency'
import { getBalanceTypeIcon } from 'common/util'
import { isCashOption } from 'app/constants'

import {
  BalanceNotification,
  useNotificationState,
} from './BalanceNotification'

import { useBalanceStyles } from './Balance.styles'

interface BalanceProps {
  showDeposit?: boolean
  dark?: boolean
  MenuProps?: Partial<MenuProps>
  className?: string
}

const UIBalance: React.FC<BalanceProps> = ({
  showDeposit = false,
  dark = false,
  className,
}) => {
  const app = useApp()
  const hideBalance = React.useMemo(() => {
    return showDeposit && app.hideBalance
  }, [app, showDeposit])

  const classes = useBalanceStyles({ dark })
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'))
  const balanceRef = React.useRef<ElementRef<'div'>>(null)
  const containerRef = React.useRef()
  const { allowed: isPaymentIQAllowed } = useFeatures(['paymentiq'])
  const { dismissBalanceNotif, typeAlert, checkUserBalance } =
    useNotificationState()

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'balanceMenu',
  })

  const { allCashierOptions } = useCashierOptions()

  // @todo: Something is causing multiple re-renders on this page, and it's not the useSelector
  // Going to keep shallowEqual here because of the logic. This is an anti-pattern.
  const [
    isLoggedIn,
    selectedBalanceType,
    balanceImage,
    balanceAmount,
    walletName,
    hideEmptyBalances,
  ] = useSelector(({ user, balances }) => {
    const isLoggedIn = !!user

    if (isLoggedIn) {
      const balance = allCashierOptions.filter(
        b => b.balanceType === balances.selectedBalanceType,
      )[0]

      const hideEmptyBalances =
        user?.systemSettings?.currency?.hideEmptyBalances ?? false

      if (!balance) {
        // defaulting to BTC (crypto) for !selectedBalance && isLoggedIn
        setBalanceType('crypto')
        return [
          true,
          'crypto',
          getWalletImageUri(allCashierOptions[0].shortCode),
          balances?.crypto,
          allCashierOptions[0].walletName,
          hideEmptyBalances,
        ]
      }

      const amount = balances[balances?.selectedBalanceType]

      return [
        true,
        balances?.selectedBalanceType,
        getWalletImageUri(balance?.shortCode),
        amount,
        balance?.walletName,
        hideEmptyBalances,
      ]
    }

    return [
      false,
      'balance',
      getWalletImageUri(allCashierOptions[0].shortCode),
      0,
      allCashierOptions[0].walletName,
      hideEmptyBalances,
    ]
  })

  // Show plus button when mobile, or on medium viewport's when chat or side nav open.
  const showPlusButton =
    !isTabletOrDesktop ||
    (isTabletOrDesktop &&
      !isDesktop &&
      (app.sideNavigationOpen || !app.chatHidden))

  const userBalances = useSelector(({ balances }) => balances, shallowEqual)

  if (!isLoggedIn) {
    return null
  }

  const openWalletDialog = () => {
    popupState.close()
    openDialog('walletSettings')
  }

  const onDeposit = () => {
    if (!showPlusButton) {
      popupState.close()
    }
    openDialog('cashier')
  }

  const changeWallet = async (field: BalanceType) => {
    popupState.close()
    await setBalanceType(field)
    checkUserBalance()
  }

  const mobileMenuOpen = app.sideNavigationOpen && !isTabletOrDesktop

  return (
    <div ref={containerRef.current}>
      <div
        id="balance"
        className={clsx(classes.UIBalance, className, {
          [classes.balanceAlert]: !!typeAlert,
        })}
        ref={balanceRef}
      >
        <div
          className={classes.UIBalanceContent}
          onClick={() => popupState.open(balanceRef.current)}
        >
          <img
            className={classes.CryptoIcon}
            alt={selectedBalanceType}
            src={getBalanceTypeIcon(selectedBalanceType)}
          />
          <Typography
            variant="body2"
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {!hideBalance ? (
              <Currency amount={balanceAmount} />
            ) : (
              <span>
                <span
                  className={classes.inGameText}
                  style={{ opacity: 0.4, marginLeft: 4 }}
                >
                  {translate('balance.inGame')}
                </span>
              </span>
            )}
          </Typography>
          <ActionIcon id="balance-action-icon">
            {popupState.isOpen ? (
              <ChevronUp width={24} height={24} />
            ) : (
              <ChevronDown width={24} height={24} />
            )}
          </ActionIcon>
        </div>
        {showDeposit && (
          <>
            {!showPlusButton ? (
              <Button
                color="primary"
                variant="contained"
                onClick={onDeposit}
                label={translate('balance.deposit')}
                size="medium"
              />
            ) : (
              <IconButton
                color="primary"
                onClick={onDeposit}
                size={isTabletOrDesktop ? 'medium' : 'small'}
              >
                <BalancePlus />
              </IconButton>
            )}
          </>
        )}

        <Popover
          {...bindPopover(popupState)}
          keepMounted
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          slotProps={{ paper: { className: classes.PopoverPaper } }}
        >
          <div className={classes.MenuItemContainer}>
            <div className={classes.BalanceTypeContainer}>
              <List>
                {allCashierOptions.map((cashierOption, idx) => {
                  const { balanceType, shortCode, crypto, walletName } =
                    cashierOption
                  const balance = userBalances[balanceType]
                  const shouldHide = shouldHideBalance({
                    balanceType,
                    balance,
                    isPaymentIQAllowed,
                    hideEmptyBalances,
                    selectedBalanceType,
                  })
                  const selected = balanceType === selectedBalanceType

                  return (
                    !shouldHide && (
                      <ListItemButton
                        className={classes.BalanceSelectorItem}
                        key={`${shortCode}-${idx}`}
                        selected={selected}
                        onClick={() => changeWallet(balanceType)}
                      >
                        <ListItemIcon>
                          <img
                            className={classes.BalanceSelectorItem__icon}
                            src={getWalletImageUri(shortCode)}
                            alt={cashierOption.walletName}
                          />
                        </ListItemIcon>
                        <div
                          className={classes.BalanceSelectorItem__textContainer}
                        >
                          <div
                            className={classes.BalanceSelectorItem__cryptoText}
                          >
                            <Typography
                              id="crypto-title"
                              variant="body2"
                              color={
                                selected
                                  ? uiTheme.palette.common.white
                                  : uiTheme.palette.neutral[200]
                              }
                              fontWeight={uiTheme.typography.fontWeightBold}
                            >
                              {crypto ?? walletName}
                            </Typography>
                            {!isCashOption(cashierOption) && (
                              <Typography
                                variant="body4"
                                color={uiTheme.palette.neutral[300]}
                                fontWeight={uiTheme.typography.fontWeightMedium}
                              >
                                {shortCode.toUpperCase()}
                              </Typography>
                            )}
                          </div>
                          <Typography
                            variant="body4"
                            color={uiTheme.palette.success[500]}
                            fontWeight={uiTheme.typography.fontWeightMedium}
                          >
                            <Currency amount={balance} />
                          </Typography>
                        </div>
                      </ListItemButton>
                    )
                  )
                })}
              </List>
            </div>

            <div className={classes.WalletSettings} onClick={openWalletDialog}>
              <div className={classes.WalletSettings__content}>
                <AccountSettings
                  width={20}
                  height={20}
                  bottomHalfFill={uiTheme.palette.neutral[400]}
                  topHalfFill={uiTheme.palette.neutral[400]}
                />
                <Typography
                  variant="body2"
                  color={uiTheme.palette.neutral[200]}
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {translate('walletSettings.title')}
                </Typography>
              </div>
            </div>
          </div>
        </Popover>
      </div>
      {(!mobileMenuOpen || isTabletOrDesktop) && (
        <BalanceNotification
          balanceRef={balanceRef}
          typeAlert={typeAlert}
          dismissBalanceNotif={dismissBalanceNotif}
        />
      )}
    </div>
  )
}
export default React.memo(UIBalance)
