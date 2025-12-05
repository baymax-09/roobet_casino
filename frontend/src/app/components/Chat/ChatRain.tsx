import React from 'react'
import ReCaptcha from 'react-google-recaptcha'
import clsx from 'clsx'
import { useImmer } from 'use-immer'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import { useSelector } from 'react-redux'

import { defaultSocket } from 'app/lib/sockets'
import { api, isApiError } from 'common/util'
import { useToasts } from 'common/hooks'
import { useTranslate, useDialogsOpener } from 'app/hooks'
import { type BalanceType } from 'common/types'

import { Currency } from '../DisplayCurrency'

import { useChatRainStyles } from './ChatRain.styles'

interface ActiveRain {
  id: string
  creatorUserId: string
  creatorName: string
  createdByUser: boolean
  amount: number
  rainInit: string
  rainStartTime: string
  rainEndTime: string
  status: string
  balanceType: BalanceType
  hasJoined: boolean
}

const getTime = dateString => new Date(dateString).getTime()

/**
 * Calculates the properties for a countdown timer based on a rain object.
 *
 * @param {Object} rain - The rain object.
 * @param {string} rain.rainInit - The time the rain was initialized.
 * @param {string} rain.rainStartTime - The time the rain will start.
 * @param {string} rain.rainEndTime - The time the rain will end.
 *
 * @returns {Object} An object containing the following properties:
 * - wholeSecondsUntilNextState: The whole number of seconds until the next state (either the start or end of the rain).
 * - currentDegree: The current degree of the countdown timer,
 * calculated as a proportion of the total time for the current state.
 * - timeUntilEnd: The number of milliseconds until the end of the rain.
 */
const calculateCountdownTimerProps = rain => {
  const { rainInit, rainStartTime, rainEndTime } = rain

  const timeUntilStart = getTime(rainStartTime) - Date.now()
  const timeUntilEnd = getTime(rainEndTime) - Date.now()

  // The time until the next state (either the start or end of the rain).
  const timeUntilNextState = timeUntilStart > 0 ? timeUntilStart : timeUntilEnd
  // The total time for the current state.
  // Math.max(0, ...) is used to prevent negative values.
  const totalTime = Math.max(
    0,
    timeUntilStart > 0
      ? getTime(rainStartTime) - getTime(rainInit)
      : getTime(rainEndTime) - getTime(rainStartTime),
  )

  // The whole number of seconds until the next state (either the start or end of the rain).
  const wholeSecondsUntilNextState = Math.floor(timeUntilNextState / 1000)
  // The current degree of the countdown timer, calculated as a proportion of the total time for the current state.
  const currentDegree =
    totalTime > 0 ? Math.floor((timeUntilNextState / totalTime) * 360) : 0

  return { wholeSecondsUntilNextState, currentDegree, timeUntilEnd }
}

const ChatRain: React.FC = () => {
  const openDialog = useDialogsOpener()
  const translate = useTranslate()
  const clockBorder = React.useRef<HTMLDivElement>(null)
  const { toast } = useToasts()

  const [rain, updateRain] = useImmer<ActiveRain | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [joinedRain, setJoinedRain] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)
  const recaptchaRef = React.useRef<InstanceType<typeof ReCaptcha>>(null)

  const countdownTimerRef = React.useRef<NodeJS.Timer | null>(null)

  React.useEffect(() => {
    // Function for reinitializing the countdown timer.
    const resetCountdown = () => {
      // Stop the timer.
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
      // Reset the timer reference.
      countdownTimerRef.current = null
      // Reset the countdown display and clock angle.
      setCountdown(0)
      updateClockDeg(0)
    }

    // Function for updating the countdown display and clock angle.
    const tick = () => {
      if (!rain || !rain.rainInit || !rain.rainEndTime || !rain.rainStartTime) {
        return
      }
      const { wholeSecondsUntilNextState, currentDegree, timeUntilEnd } =
        calculateCountdownTimerProps(rain)

      // Update the countdown display.
      setCountdown(wholeSecondsUntilNextState)
      // Update the display angle on the clock.
      updateClockDeg(currentDegree)

      // If the rain has ended, stop the timer.
      if (timeUntilEnd <= 0 && countdownTimerRef.current) {
        return resetCountdown()
      }
    }

    // If there is no timer and the rain is active, start the timer.
    // This ensures the timer is only started once, which prevents stuttering.
    if (rain && !countdownTimerRef.current) {
      // Update the countdown every 50ms.
      // 50ms is small enough to make the countdown appear silky smooth without causing performance issues.
      countdownTimerRef.current = setInterval(tick, 50)
    }
  }, [rain])

  // Stop the timer when the component unmounts.
  React.useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [])

  const userId = useSelector(({ user }) => (user ? user.id : null))
  const classes = useChatRainStyles()
  const joinRain = React.useCallback(() => {
    const join = () => {
      if (!userId) {
        openDialog('auth')
        return
      }

      try {
        recaptchaRef.current?.execute()
      } catch (err) {
        toast.error(translate('authDialog.recaptchaError'))
      }
    }

    join()
  }, [userId, openDialog, recaptchaRef])

  const updateClockDeg = deg => {
    if (!clockBorder.current) {
      return
    }

    let backgroundImage = ''

    if (deg <= 180) {
      backgroundImage =
        'linear-gradient(' +
        (90 + deg) +
        `deg, transparent 50%, ${uiTheme.palette.neutral[800]} 50%),linear-gradient(90deg, ${uiTheme.palette.neutral[800]} 50%, transparent 50%)`
    } else {
      backgroundImage =
        'linear-gradient(' +
        (deg - 90) +
        `deg, transparent 50%, ${uiTheme.palette.primary.main} 50%),linear-gradient(90deg, ${uiTheme.palette.neutral[800]} 50%, transparent 50%)`
    }

    clockBorder.current.style['background-image'] = backgroundImage
  }

  React.useEffect(() => {
    const load = async () => {
      try {
        const activeRain = await api.get<any, ActiveRain | null>('/rain/active')

        if (activeRain?.id) {
          updateRain(() => activeRain)
          setJoinedRain(activeRain.hasJoined)
        }
      } catch (err) {}
    }

    load()
  }, [updateRain])

  React.useEffect(() => {
    const onUpdate = update => {
      if (update.status === 'ended') {
        setJoinedRain(false)
        updateRain(() => null)
        return
      }
      updateRain(r => ({
        ...r,
        ...update,
      }))
    }

    defaultSocket._socket.on('rainUpdate', onUpdate)

    return () => {
      defaultSocket._socket.on('rainUpdate', onUpdate)
    }
  }, [updateRain, setJoinedRain])

  const onRecaptchaChange = async () => {
    if (!recaptchaRef.current) {
      toast.error(translate('authDialog.recaptchaError'))
      return
    }

    const recaptcha = recaptchaRef.current.getValue()
    recaptchaRef.current.reset()

    try {
      setBusy(true)

      if (rain) {
        await api.post('/rain/joinRain', {
          rainId: rain.id,
          recaptcha,
        })

        setJoinedRain(true)
        window.dataLayer.push({ event: 'rain_join' })
      }
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.response ? err.response.data : err.message)
      }
    }

    setBusy(false)
  }

  /*
   * translate('chatRain.startingSoon')
   * translate('chatRain.joinedRain')
   * translate('chatRain.joinRain')
   */

  return (
    <div
      className={clsx(classes.ChatRain, {
        [classes.ChatRain_visible]: !!rain && rain.status !== 'ended',
      })}
    >
      {!!rain && (
        <>
          <div className={classes.ChatRain__rainClock}>
            <div ref={clockBorder} className={classes.RainClock__clockBorder}>
              <div className={classes.RainClock__clockCircle}>
                <span className={classes.RainClock__clockText}>
                  {countdown}
                </span>
              </div>
            </div>
          </div>

          <div className={classes.ChatRain__message}>
            <Typography
              variant="body2"
              className={classes.Message__title}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {translate('chatRain.rain')}:{' '}
              <Currency amount={rain.amount} format="0,0.00[0]" />
            </Typography>
            {rain.createdByUser && (
              <Typography variant="body4" className={classes.Message__subtitle}>
                {translate('chatRain.creator')}: {rain.creatorName}
              </Typography>
            )}
          </div>

          <Button
            className={classes.ChatRain__button}
            disabled={busy || joinedRain || rain.status !== 'active'}
            onClick={joinRain}
            variant="contained"
            size="medium"
            color={
              !joinedRain && rain.status !== 'countdown'
                ? 'primary'
                : 'secondary'
            }
            label={translate(
              !joinedRain
                ? rain.status === 'countdown'
                  ? 'chatRain.startingSoon'
                  : 'chatRain.joinRain'
                : 'chatRain.joinedRain',
            )}
          ></Button>
          <ReCaptcha
            ref={recaptchaRef}
            size="invisible"
            sitekey="6LcyLZQUAAAAALOaIzlr4pTcnRRKEQn-d6sQIFUx"
            onErrored={() => {
              toast.error(translate('authDialog.recaptchaError'))
            }}
            onChange={onRecaptchaChange}
          />
        </>
      )}
    </div>
  )
}

export default React.memo(ChatRain)
