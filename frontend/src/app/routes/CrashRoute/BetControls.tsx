import React from 'react'
import clsx from 'clsx'
import numeral from 'numeral'
import {
  ButtonGroup,
  Button,
  Grid,
  InputAdornment,
  Tooltip,
} from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import { useSelector } from 'react-redux'
import { usePopupState } from 'material-ui-popup-state/hooks'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { ActionButton, ResultPopover } from 'mrooi'
import { playSound, loadSoundScope } from 'app/lib/sound'
import { defaultSocket } from 'app/lib/sockets'
import {
  useDialogsOpener,
  useTranslate,
  useCurrencyDisplay,
  useCurrencyUnexchange,
  useIsLoggedIn,
} from 'app/hooks'
import {
  modifyBet,
  hasStorageItem,
  getStorageItem,
  setStorageItem,
  initialBetAmount,
  roundBalance,
} from 'app/util'
import { api } from 'common/util'

import { AutomatedBettingStrategy } from './BettingStrategy'
import { CrashEngine } from './CrashEngine'
import ControlTextField from './ControlTextField'

import { styles, useBetControlsStyles } from './BetControls.styles'

interface BetControlsProps {
  socketRef: any
  isLoggedIn: boolean
  onCashout: () => void
  crashState: string // I'm sure there is a more specific type somewhere
  onAutoCashoutChange: (cashout: number | null) => void
  userBet: {
    id: string
    cashoutCrashPoint: number
    payoutValue: number
    betAmount: number
  }
  mode: number
  activeBet: {
    betAmount: number
  }
  crashEngineRef: any
}

export const BetControls: React.FC<BetControlsProps> = React.memo(props => {
  const {
    crashState,
    onAutoCashoutChange,
    userBet,
    mode,
    activeBet,
    crashEngineRef,
  } = props

  const isLoggedIn = useIsLoggedIn()
  const userSelectedBalanceType = useSelector(
    ({ balances }) => balances?.selectedBalanceType ?? '',
  )

  const balance = useSelector(({ balances }) =>
    balances ? balances[balances.selectedBalanceType] : 0,
  )

  const _walletBalance = useSelector(({ user }) => {
    if (!user || !userSelectedBalanceType) {
      return 0
    }

    if (balance < 0.01) {
      return 0
    }

    return roundBalance(balance)
  })

  const displayCurrencyExchange = useCurrencyDisplay()

  const getInitialBet = () => {
    if (!isLoggedIn) {
      return 0
    }

    return initialBetAmount(balance)
  }

  const translate = useTranslate()
  const unexchangeCurrency = useCurrencyUnexchange()
  const openDialog = useDialogsOpener()
  const [betAmount, setBetAmount] = React.useState(() => getInitialBet())
  const [autoCashout, setAutoCashout] = React.useState(() => {
    const exists = hasStorageItem('crash:autoCashout')
    return (
      exists ? parseFloat(getStorageItem('crash:autoCashout')) || 25 : 25
    ).toFixed(2)
  })

  const lastProps = React.useRef<Partial<BetControlsProps & { state: string }>>(
    {},
  )
  const strategy = React.useRef<AutomatedBettingStrategy>()
  const winInputRef = React.useRef<HTMLInputElement>(null)
  const lossInputRef = React.useRef<HTMLInputElement>(null)
  const placeBetButtonRef = React.useRef<HTMLButtonElement>(null)

  const [placingBet, setPlacingBet] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [autoPilot, setAutoPilot] = React.useState(false)
  const [stopAutoPilot, setStopAutoPilot] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const [totalBets, setTotalBets] = React.useState(0)
  const [winModifier, setWinModifier] = React.useState('')
  const [lossModifier, setLossModifier] = React.useState('')
  const [stopOnProfit, setStopOnProfit] = React.useState('0.00')
  const [stopOnLoss, setStopOnLoss] = React.useState('0.00')

  const { currencySymbol: preferredCurrencySymbol } = displayCurrencyExchange(0)
  const functionalBetAmount = unexchangeCurrency(parseFloat(betAmount))
  const functionalStopLoss = unexchangeCurrency(parseFloat(stopOnLoss))
  const functionalStopProfit = unexchangeCurrency(parseFloat(stopOnProfit))

  const classes = useBetControlsStyles()

  const resultPopupState = usePopupState({
    variant: 'popover',
    popupId: 'betPopover',
  })

  const onPlaceBet = async (force = false, params = {}) => {
    if (!isLoggedIn) {
      openDialog('auth')
      return
    }

    if (mode === 1 && !force) {
      if (autoPilot) {
        if (!strategy.current) {
          setAutoPilot(false)
          return
        } else if (!!userBet && !userBet.payoutValue) {
          setStopAutoPilot(true)
          strategy.current.stopping = true
          return
        }

        strategy.current.stop()
        return
      }
    }

    if (mode === 1 && !force) {
      if (mode === 1) {
        setAutoPilot(true)
        strategy.current = new AutomatedBettingStrategy(
          crashEngineRef.current,
          crashState,
          {
            betAmount: functionalBetAmount,
            onWinModifier: winModifier !== '' ? parseFloat(winModifier) : null,
            onLossModifier:
              lossModifier !== '' ? parseFloat(lossModifier) : null,
            stopOnProfit: functionalStopProfit,
            stopOnLoss: functionalStopLoss,
            maxNumberOfBets: Math.floor(totalBets),
          },
        )

        strategy.current.onStop(() => {
          setAutoPilot(false)
          strategy.current = null
        })

        strategy.current.onBet(({ remainingBets }) => {
          setTotalBets(remainingBets)
        })

        strategy.current.onStop(() => {
          setAutoPilot(false)
          setStopAutoPilot(false)
          strategy.current = null
        })

        strategy.current.onError(_ => {
          // toast.error(!!err.response ? err.response.data : err.message)
        })

        strategy.current.onRoll(params => {
          return onPlaceBet(true, params)
        })

        strategy.current.start()
        return
      }
    }

    setStorageItem('bet:crash', betAmount)

    if (mode === 0 && crashState !== CrashEngine.States.Starting) {
      setPlacingBet(pb => !pb)
      return
    } /* else if (!force && placingBet) {
      setPlacingBet(false)
      return
    } */

    setBusy(true)
    setPlacingBet(false)

    if (mode === 0 && functionalBetAmount < 0.01) {
      setBusy(false)

      props.socketRef.current.emit('crashBet', {
        autoCashout: 25,
        balanceType: 'crypto',
        betAmount: 0,
        id: 'demo',
        user: {
          name: 'Demo',
        },
        userId: 'demo',
      })

      return
    }
    try {
      const result = await api.post('/crash/joinGame', {
        betAmount: functionalBetAmount,
        autoCashout: parseFloat(autoCashout),
        ...params,
        autobet: strategy.current
          ? {
              ...strategy.current.options,
              rolls: strategy.current.rolls,
            }
          : null,
      })
      setBusy(false)
      setStorageItem('lastBetAmount', betAmount)
      setStorageItem('crash:autoCashout', autoCashout)
      return result
    } catch (err) {
      setBusy(false)
      setHasError(true)
      setResult(err.response ? err.response.data : err.message)
      resultPopupState.open(placeBetButtonRef.current)
    }
  }

  React.useEffect(() => {
    if (stopAutoPilot) {
      onCashout()
    }
  }, [stopAutoPilot])

  React.useEffect(() => {
    if (!!lastProps.current.state && lastProps.current.state !== crashState) {
      if (autoPilot) {
        if (strategy.current) {
          if (crashState === 'TakingBets' && stopAutoPilot) {
            strategy.current.stop()
            return
          }

          strategy.current.update(crashState)

          const ac = parseFloat(autoCashout)

          if (
            !!userBet &&
            crashState === 'Over' &&
            (autoCashout <= crashEngineRef.current.finalMultiplier ||
              userBet.cashoutCrashPoint <=
                crashEngineRef.current.finalMultiplier)
          ) {
            strategy.current.onWon(
              userBet.payoutValue || userBet.betAmount * ac,
            )
          } else if (
            !!userBet &&
            crashState === 'Over' &&
            !userBet.payoutValue
          ) {
            strategy.current.onLoss(userBet)
          }
        }
      }
    }

    lastProps.current.state = crashState
  }, [autoPilot, crashState, stopAutoPilot])

  React.useEffect(() => {
    loadSoundScope('mines')
    return () => {
      if (strategy.current) {
        strategy.current.stop()
        strategy.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    if (
      typeof lastProps.current.isLoggedIn !== 'undefined' &&
      lastProps.current.isLoggedIn !== isLoggedIn
    ) {
      setBetAmount(getInitialBet())
    }

    lastProps.current.isLoggedIn = isLoggedIn
  }, [isLoggedIn])

  React.useEffect(() => {
    if (
      !!lastProps.current.crashState &&
      lastProps.current.crashState !== crashState
    ) {
      if (placingBet && crashState === CrashEngine.States.Starting) {
        setPlacingBet(false)
        onPlaceBet(false, true)
      }
    }

    lastProps.current.crashState = crashState
  }, [crashState, placingBet, onPlaceBet])

  React.useEffect(() => {
    onAutoCashoutChange(
      Number.isNaN(autoCashout) || !autoCashout ? null : autoCashout,
    )
  }, [onAutoCashoutChange, autoCashout])

  const onCashout = React.useCallback(() => {
    crashEngineRef.current.multiplierAtCashout =
      crashEngineRef.current.multiplier
    crashEngineRef.current.cashedOut = true
    if (userBet.id === 'demo') {
      props.socketRef.current.emit('crashBet', {
        cashoutCrashPoint: crashEngineRef.current.multiplier,
        payoutValue: 0,
        id: 'demo',
        userId: 'demo',
      })

      return
    }

    setBusy(true)
    setHasError(false)
    setResult(null)

    defaultSocket._socket.emit(
      'crash_cashout',
      {
        socketToken: defaultSocket.socketToken,
        betId: userBet.id,
      },
      (err, result) => {
        setBusy(false)

        if (err) {
          setHasError(true)
          setResult(err)
          resultPopupState.open(placeBetButtonRef.current)
          return
        }
        playSound('mines', 'win')
        props.onCashout()
      },
    )
  }, [userBet, setBusy, userSelectedBalanceType, _walletBalance])

  const onModifyBet = modifier => {
    const newBetAmount = modifyBet(
      balance,
      functionalBetAmount,
      modifier,
      displayCurrencyExchange,
    )
    setBetAmount(newBetAmount)
  }
  const onStopChange = event => {
    const onStopAmount = parseFloat(event.target.value)
    if (event.target.name === 'stopOnLoss')
      setStopOnLoss(onStopAmount.toString())
    if (event.target.name === 'stopOnProfit')
      setStopOnProfit(onStopAmount.toString())
  }

  const disableControls = busy || !!activeBet || placingBet || autoPilot
  const isDemo =
    isLoggedIn &&
    mode === 0 &&
    (functionalBetAmount <= 0 || (!!activeBet && activeBet.betAmount <= 0))

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <Grid spacing={1} container>
          <Grid item xs={12}>
            <ControlTextField
              disabled={disableControls}
              type="number"
              label={translate('betControls.betAmount')}
              placeholder="0.00"
              value={betAmount}
              onChange={event => setBetAmount(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {preferredCurrencySymbol}
                  </InputAdornment>
                ),

                endAdornment: (
                  <div className={classes.modifierButtons}>
                    <Button
                      disabled={disableControls}
                      onClick={() => onModifyBet(0.5)}
                    >
                      &frac12;
                    </Button>
                    <Button
                      disabled={disableControls}
                      onClick={() => onModifyBet(2)}
                      // eslint-disable-next-line i18next/no-literal-string
                    >
                      2&times;
                    </Button>
                    <Button
                      disabled={disableControls}
                      onClick={() => onModifyBet('max')}
                      // eslint-disable-next-line i18next/no-literal-string
                    >
                      Max
                    </Button>
                  </div>
                ),
              }}
            />
          </Grid>
          <Grid item xs={mode === 1 ? 6 : 12}>
            <ControlTextField
              disabled={disableControls || isDemo}
              type="number"
              label={translate('betControls.autoCashout')}
              helperText={isDemo && translate('betControls.autoCashoutText')}
              placeholder="2.00"
              value={autoCashout}
              onChange={event => setAutoCashout(event.target.value)}
              onBlur={() => {
                const value = Number(autoCashout)
                if (value > 0) {
                  setAutoCashout(value.toFixed(2))
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setAutoCashout('0.00')}
                      size="small"
                      startIcon={<ClearIcon />}
                      disableRipple={true}
                      classes={{
                        startIcon: classes.ClearTextButton__iconAdjustment,
                      }}
                      sx={{
                        minWidth: 'revert',
                        padding: 0.5,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {mode === 1 && (
            <Grid item xs={6}>
              <ControlTextField
                disabled={disableControls}
                type="number"
                label=" Total Bets"
                placeholder="Total Bets"
                value={totalBets}
                onBlur={() => {
                  if (totalBets.length > 0) {
                    setTotalBets(Math.max(0, ~~Number(totalBets)))
                  }
                }}
                onChange={event => {
                  if (!event.target.value.length) {
                    setTotalBets('')
                    return
                  }

                  setTotalBets(event.target.value)
                }}
                InputProps={
                  Number(totalBets) === 0
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <AllInclusiveIcon />
                          </InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
            </Grid>
          )}

          {mode === 1 && (
            <Grid item xs={12}>
              <ControlTextField
                inputRef={winInputRef}
                disabled={disableControls}
                type="number"
                label="On Win"
                placeholder="0.00"
                value={winModifier}
                onChange={event => setWinModifier(event.target.value)}
                onBlur={() => {
                  if (winModifier === '' || parseInt(winModifier) <= 0) {
                    setWinModifier('')
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">%</InputAdornment>
                  ),

                  endAdornment: (
                    <div className={classes.modifierButtons}>
                      <ButtonGroup
                        sx={{
                          border: 0,
                          '&.MuiButton': {
                            border: 0,
                            borderRadius: 0.5,
                          },
                        }}
                      >
                        <Button
                          size="small"
                          sx={styles.button}
                          className={clsx({
                            [classes.activeButton]: winModifier !== '',
                          })}
                          disabled={disableControls}
                          onClick={() => {
                            winInputRef.current?.focus()
                            setWinModifier('0.00')
                          }}
                          // eslint-disable-next-line i18next/no-literal-string
                        >
                          Increase
                        </Button>
                        <Button
                          size="small"
                          className={clsx({
                            [classes.activeButton]: winModifier === '',
                          })}
                          disabled={disableControls}
                          onClick={() => setWinModifier('')}
                          // eslint-disable-next-line i18next/no-literal-string
                        >
                          Reset
                        </Button>
                      </ButtonGroup>
                    </div>
                  ),
                }}
              />
            </Grid>
          )}

          {mode === 1 && (
            <Grid item xs={12}>
              <ControlTextField
                inputRef={lossInputRef}
                disabled={disableControls}
                type="number"
                label="On Loss"
                placeholder="0.00"
                value={lossModifier}
                onChange={event => setLossModifier(event.target.value)}
                onBlur={() => {
                  if (lossModifier === '' || parseInt(lossModifier) <= 0) {
                    setLossModifier('')
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">%</InputAdornment>
                  ),

                  endAdornment: (
                    <div className={classes.modifierButtons}>
                      <ButtonGroup classes={{ grouped: classes.groupedButton }}>
                        <Button
                          size="small"
                          sx={styles.button}
                          className={clsx({
                            [classes.activeButton]: lossModifier !== '',
                          })}
                          disabled={disableControls}
                          onClick={() => {
                            lossInputRef.current?.focus()
                            setLossModifier('0.00')
                          }}
                          // eslint-disable-next-line i18next/no-literal-string
                        >
                          Increase
                        </Button>
                        <Button
                          size="small"
                          className={clsx({
                            [classes.activeButton]: lossModifier === '',
                          })}
                          disabled={disableControls}
                          onClick={() => setLossModifier('')}
                          // eslint-disable-next-line i18next/no-literal-string
                        >
                          Reset
                        </Button>
                      </ButtonGroup>
                    </div>
                  ),
                }}
              />
            </Grid>
          )}

          {mode === 1 && (
            <Grid item xs={6}>
              <ControlTextField
                name="stopOnProfit"
                disabled={disableControls}
                type="number"
                label="Stop on Profit"
                placeholder="0.00"
                value={stopOnProfit}
                onChange={onStopChange}
                onBlur={() => {
                  const value = Number(functionalStopProfit)

                  if (!value || value < 0) {
                    setStopOnProfit('0.00')
                  } else {
                    setStopOnProfit(numeral(value).format('0.00[000000]'))
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {preferredCurrencySymbol}
                    </InputAdornment>
                  ),

                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={translate('betControls.betStopTooltipText')}
                      >
                        <span className={classes.maxProfit}>
                          <FontAwesomeIcon icon={['fas', 'info-circle']} />
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {mode === 1 && (
            <Grid item xs={6}>
              <ControlTextField
                name="stopOnLoss"
                disabled={disableControls}
                type="number"
                label="Stop on Loss"
                placeholder="0.00"
                value={stopOnLoss}
                onChange={onStopChange}
                onBlur={() => {
                  const value = Number(functionalStopLoss)

                  if (!value || value < 0) {
                    setStopOnLoss('0.00')
                  } else {
                    setStopOnLoss(numeral(value).format('0.00[000000]'))
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {preferredCurrencySymbol}
                    </InputAdornment>
                  ),

                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={translate('betControls.betStopLossTooltipText')}
                      >
                        <span className={classes.maxProfit}>
                          <FontAwesomeIcon icon={['fas', 'info-circle']} />
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {mode === 1 && (
            <Grid item xs={12} sx={{ pt: '16px !important' }}>
              <ActionButton
                disabled={busy || stopAutoPilot}
                className={clsx({
                  [classes.cancelBetButton]: autoPilot,
                })}
                ref={placeBetButtonRef}
                onClick={() => onPlaceBet()}
                fullWidth
                variant="contained"
                color={autoPilot ? 'tertiary' : 'primary'}
                sx={[autoPilot && { transition: 'none' }]}
              >
                {autoPilot ? 'Stop Autobet' : 'Start Autobet'}
              </ActionButton>
            </Grid>
          )}

          {mode === 0 && (
            <Grid item xs={12} sx={{ pt: '16px !important' }}>
              {!activeBet ? (
                <ActionButton
                  disabled={busy}
                  sx={[placingBet && { transition: 'none' }]}
                  className={clsx({
                    [classes.cancelBetButton]: placingBet,
                  })}
                  color={placingBet ? 'tertiary' : 'primary'}
                  ref={placeBetButtonRef}
                  onClick={() => onPlaceBet()}
                  fullWidth
                  variant="contained"
                >
                  {!placingBet
                    ? mode === 0 && functionalBetAmount < 0.01
                      ? translate('betControls.playDemo')
                      : translate('betControls.placeBet')
                    : translate('betControls.cancelBet')}
                </ActionButton>
              ) : (
                <ActionButton
                  disabled={busy || crashState !== CrashEngine.States.Active}
                  color={
                    crashState !== CrashEngine.States.Active
                      ? 'primary'
                      : 'tertiary'
                  }
                  className={classes.placeBetButton}
                  ref={placeBetButtonRef}
                  onClick={onCashout}
                  fullWidth
                  variant="contained"
                  sx={[
                    crashState !== CrashEngine.States.Active && {
                      transition: 'none',
                    },
                  ]}
                >
                  {crashState !== CrashEngine.States.Active
                    ? translate('betControls.starting')
                    : translate('betControls.cashOut')}
                </ActionButton>
              )}
            </Grid>
          )}
        </Grid>
        <div
          className={clsx(classes.betNotice, {
            [classes.betNoticeVisible]:
              isLoggedIn &&
              mode === 0 &&
              !activeBet &&
              functionalBetAmount < 0.01,
          })}
        >
          <FontAwesomeIcon icon={['fas', 'info-circle']} />{' '}
          {translate('betControls.updatedDemoMode')}
        </div>
      </div>

      <ResultPopover
        popupState={resultPopupState}
        error={hasError}
        message={result}
      />
    </div>
  )
})
