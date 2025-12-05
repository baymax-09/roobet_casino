import React, { type ElementRef, type RefObject } from 'react'
import clsx from 'clsx'
import { Popper, Fade } from '@mui/material'
import { useSelector } from 'react-redux'
import { ActionIcon, Typography, theme as uiTheme } from '@project-atl/ui'
import { Close } from '@project-atl/ui/assets'

import { defaultSocket } from 'app/lib/sockets'
import { useIsDialogOpen, useTranslate, useDialogsOpener } from 'app/hooks'
import { type BalanceType } from 'common/types'

import { useBalanceStyles } from './Balance.styles'

export type Alert =
  | 'hasDeposit'
  | 'noDeposit'
  | 'lowBalance'
  | 'emptyBalance'
  | null

interface BalanceNotificationProps {
  dark?: boolean
  balanceRef: RefObject<ElementRef<'div'> | null>
  typeAlert: Alert
  dismissBalanceNotif: () => void
}

interface LastBet {
  betAmount: number
  payoutValue: number
  balanceType: BalanceType
}

const EMPTY = 0.01
const IDLE_TIME = 1000 * 60

export const useNotificationState = () => {
  const [dismissed, setDismissed] = React.useState(false)
  const [typeAlert, setTypeAlert] = React.useState<Alert | null>(null)
  const [lastBet, setLastBet] = React.useState<LastBet | null>(null)
  const [elapsed, setElapsed] = React.useState(false)

  const user = useSelector(({ user }) => user)
  const userBalance = useSelector(({ balances }) =>
    balances ? balances[balances.selectedBalanceType] : 0,
  )
  const selectedBalanceType = useSelector(
    ({ balances }) => balances.selectedBalanceType,
  )
  const idleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>()
  const isCashierOpen = useIsDialogOpen('cashier')

  React.useEffect(() => {
    const handleBetAlert = bet => {
      const { payoutValue, balanceType, betAmount } = bet
      setLastBet({ betAmount, payoutValue, balanceType })
    }

    defaultSocket._socket.on('new_bet_self', handleBetAlert)
    return () => {
      defaultSocket._socket.off('new_bet_self', handleBetAlert)
    }
  }, [])

  const checkUserBalance = React.useCallback(() => {
    if (dismissed) {
      return
    }
    // When my balance changes, a bet finishes, or my selected balance type changes
    if (lastBet && lastBet.balanceType === selectedBalanceType) {
      // if I just bet and it is the same balance type as my selected balance type
      if (
        lastBet.betAmount > userBalance &&
        userBalance > EMPTY &&
        lastBet.payoutValue < EMPTY
      ) {
        // then, if my balance is lower than my previous bet amount, show low alert
        setTypeAlert('lowBalance')
      }
      if (userBalance < EMPTY && lastBet.payoutValue < EMPTY) {
        // or, if my balance is empty, show empty alert
        setTypeAlert('emptyBalance')
      }
      setLastBet(null)
    } else if (userBalance < EMPTY && elapsed) {
      if (user.hiddenTotalDeposits) {
        setTypeAlert('hasDeposit')
      } else {
        setTypeAlert('noDeposit')
      }
    } else {
      setTypeAlert(null)
      setElapsed(false)
    }
  }, [
    userBalance,
    dismissed,
    lastBet,
    selectedBalanceType,
    elapsed,
    user.hiddenTotalDeposits,
  ])

  const dismissBalanceNotif = React.useCallback(() => {
    // @ts-expect-error we need to figure out how to remove NodeJS types from our types
    clearTimeout(idleTimer.current)
    setDismissed(true)
    setElapsed(false)
  }, [])

  React.useEffect(() => {
    // If the cashier is open, that means we can dismiss an open alert or stop counting down otherwise
    if (isCashierOpen) {
      if (typeAlert) {
        dismissBalanceNotif()
      } else {
        // @ts-expect-error we need to figure out how to remove NodeJS types from our types
        clearTimeout(idleTimer.current)
      }
    }
  }, [dismissBalanceNotif, isCashierOpen, typeAlert])

  React.useEffect(() => {
    // When the idle timer elapses, if the cashier dialog is not open, pop the notification
    if (elapsed && !isCashierOpen) {
      checkUserBalance()
    }
  }, [elapsed, checkUserBalance, isCashierOpen])

  React.useEffect(() => {
    if (lastBet) {
      checkUserBalance()
    }
  }, [checkUserBalance, lastBet])

  React.useEffect(() => {
    // if I've already dismissed the notification or there is an alert, don't start the timer
    if (dismissed || typeAlert || elapsed || isCashierOpen) {
      return
    }

    if (userBalance < EMPTY) {
      // if my balance is empty, start a timer until the notification should pop if the cashier dialog isn't opened
      // @ts-expect-error we need to figure out how to remove NodeJS types from our types
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setElapsed(true)
      }, IDLE_TIME)
    }

    return () => {
      // @ts-expect-error we need to figure out how to remove NodeJS types from our types

      clearTimeout(idleTimer.current)
    }
  }, [dismissed, elapsed, typeAlert, userBalance, isCashierOpen])

  return {
    checkUserBalance,
    dismissBalanceNotif,
    typeAlert: !dismissed ? typeAlert : null,
  }
}

export const BalanceNotification: React.FC<BalanceNotificationProps> = ({
  balanceRef,
  dark = false,
  typeAlert,
  dismissBalanceNotif,
}) => {
  const translate = useTranslate()
  const classes = useBalanceStyles({ dark })
  const id = typeAlert ? 'simple-popover' : undefined
  const openDialog = useDialogsOpener()

  const openCashierDialog = () => {
    openDialog('cashier')
  }

  const onClose = (evt: React.MouseEvent) => {
    dismissBalanceNotif()
    evt.stopPropagation()
  }

  const hoverIconBackgroundColor = React.useMemo(() => {
    if (typeAlert === 'lowBalance') {
      return uiTheme.palette.secondary[700]
    }
    if (typeAlert === 'emptyBalance') {
      return uiTheme.palette.error[700]
    }
    return uiTheme.palette.primary[700]
  }, [typeAlert])

  if (!typeAlert) {
    return null
  }

  const color =
    typeAlert === 'lowBalance'
      ? uiTheme.palette.neutral[900]
      : uiTheme.palette.common.white

  return (
    <Popper
      id={id}
      open={!!typeAlert}
      anchorEl={balanceRef.current}
      className={clsx(classes.balancePopover, {
        [classes.lowBalance]: typeAlert === 'lowBalance',
        [classes.emptyBalance]: typeAlert === 'emptyBalance',
        [classes.idleBalance]:
          typeAlert === 'noDeposit' || typeAlert === 'hasDeposit',
      })}
      placement="bottom"
      onClick={openCashierDialog}
      container={balanceRef.current}
      transition
    >
      {({ TransitionProps }) => (
        <Fade in={!!typeAlert} timeout={600} {...TransitionProps}>
          <div className={classes.popoverContainer}>
            <Typography
              fontWeight={uiTheme.typography.fontWeightMedium}
              variant="body2"
              color={color}
              className={classes.popoverText}
            >
              {
                // Translating notification names but don't want tests to fail
                // translate('balance.noDeposit')
                // translate('balance.hasDeposit')
                // translate('balance.lowBalance')
                // translate('balance.emptyBalance')
                translate(`balance.${typeAlert}`)
              }
            </Typography>
            <ActionIcon
              hoverBackgroundColor={hoverIconBackgroundColor}
              onClick={onClose}
            >
              <Close iconFill={color} />
            </ActionIcon>
          </div>
        </Fade>
      )}
    </Popper>
  )
}
