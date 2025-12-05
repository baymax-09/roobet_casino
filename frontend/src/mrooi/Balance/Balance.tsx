import React, { type ElementRef } from 'react'
import clsx from 'clsx'
import { shallowEqual, useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/AddRounded'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from 'material-ui-popup-state/hooks'
import {
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  type MenuProps,
} from '@mui/material'
import { Button, IconButton, theme as uiTheme } from '@project-atl/ui'

import wallet from 'assets/images/icons/currency/wallet.svg'
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

const Balance: React.FC<BalanceProps> = ({
  showDeposit = false,
  dark = false,
  className,
  MenuProps = {},
}) => {
  const app = useApp()

  const hideBalance = React.useMemo(() => {
    return showDeposit && app.hideBalance
  }, [app, showDeposit])

  const classes = useBalanceStyles({ dark })
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))
  const showPlusButton = useMediaQuery(() => uiTheme.breakpoints.up('sm'))
  const balanceRef = React.useRef<ElementRef<typeof Paper>>(null)
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

      if (!balance) {
        return []
      }

      const amount = balances[balances?.selectedBalanceType]
      const hideEmptyBalances =
        user?.systemSettings?.currency?.hideEmptyBalances ?? false

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

  return (
    <div ref={containerRef.current}>
      <Paper
        className={clsx(classes.root, className, {
          [classes.balanceAlert]: !!typeAlert,
        })}
        elevation={0}
        ref={balanceRef}
      >
        <div className={classes.balance} {...bindTrigger(popupState)}>
          <div
            style={{ backgroundImage: `url(${balanceImage})` }}
            className={classes.image}
          />
          <div className={classes.amount}>
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
          </div>
          <ExpandMoreIcon className={classes.expandIcon} />
        </div>
        {showDeposit && showPlusButton && (
          <>
            {isTabletOrDesktop ? (
              <Button
                color="primary"
                variant="contained"
                onClick={onDeposit}
                label={translate('balance.deposit')}
                size="small"
              />
            ) : (
              <IconButton color="primary" onClick={onDeposit} size="small">
                <AddIcon />
              </IconButton>
            )}
          </>
        )}

        <Menu {...bindMenu(popupState)} keepMounted {...MenuProps}>
          {allCashierOptions.map((cashierOption, idx) => {
            const { balanceType, shortCode, walletName } = cashierOption
            const balance = userBalances[balanceType]
            const shouldHide = shouldHideBalance({
              balanceType,
              balance,
              isPaymentIQAllowed,
              hideEmptyBalances,
              selectedBalanceType,
            })

            return (
              !shouldHide && (
                <MenuItem
                  dense
                  divider={!showPlusButton}
                  key={`${shortCode}-${idx}`}
                  selected={balanceType === selectedBalanceType}
                  onClick={() => changeWallet(balanceType)}
                >
                  <ListItemIcon>
                    <div
                      style={{
                        backgroundImage: `url(${getWalletImageUri(shortCode)})`,
                      }}
                      className={clsx(classes.image, classes.bigImage)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <span className={classes.walletName}>{walletName}</span>
                    }
                    secondary={
                      <span
                        className={clsx(
                          classes.balanceAmount,
                          classes.walletAmount,
                        )}
                      >
                        <Currency amount={balance} />
                      </span>
                    }
                  />
                </MenuItem>
              )
            )
          })}

          <MenuItem
            dense
            onClick={openWalletDialog}
            className={classes.BalanceSelector__divider}
          >
            <ListItemIcon style={{ marginRight: 'initial' }}>
              <img
                alt="wallet"
                src={wallet}
                style={{ height: 19, width: 20, marginLeft: 4 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={translate('walletSettings.title')}
              classes={{ root: classes.BalanceSelector__walletSettings }}
            />
          </MenuItem>
        </Menu>
      </Paper>

      <BalanceNotification
        balanceRef={balanceRef}
        typeAlert={typeAlert}
        dismissBalanceNotif={dismissBalanceNotif}
      />
    </div>
  )
}
export default React.memo(Balance)
