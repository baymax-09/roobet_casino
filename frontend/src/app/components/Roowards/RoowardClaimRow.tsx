import React from 'react'
import { Button, Typography, Tooltip, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import { AnimatedNumber } from 'mrooi'
import { useRoowards, useRoowardsDispatch } from 'app/context/roowards.context'
import { roowardsWorker } from 'app/core'
import { createMoment } from 'app/util'
import { api } from 'common/util'
import { useCurrencyDisplay, useTranslate } from 'app/hooks'

import { RoowardsClaimedBanner } from './RoowardClaimBanner'
import { RoowardsProgress } from './RoowardsProgress'

import { useRoowardClaimRowStyles } from './RoowardClaimRow.styles'

export const countdownSecondsRemaining = {
  /* eslint-disable id-length */
  d: 86400,
  w: 604800,
  m: 2592000,
  // eslint-enable id-length
}

interface RoowardDialogClaimRowProps {
  reward: any
  totalWagered: number
  setClaimResponse: (claimedInfo: any, claimedAmount: number) => void
}

export const getTimerText = (timerText: string) => {
  const times = timerText.split(':')
  if (times.length === 4) {
    return `${times[0]}d ${times[1]}h ${times[2]}m`
  }
  if (times.length === 3) {
    return `${times[0]}h ${times[1]}m ${times[2]}s`
  }
  if (times.length === 2) {
    return `${times[0]}m ${times[1]}s`
  }
  return `${times[0]}s`
}

export const RoowardClaimRow: React.FC<RoowardDialogClaimRowProps> = React.memo(
  ({ reward, totalWagered, setClaimResponse }) => {
    const classes = useRoowardClaimRowStyles({})
    const translate = useTranslate()
    const displayCurrencyExchange = useCurrencyDisplay()
    const { refetch } = useRoowards()

    const [claiming, setClaiming] = React.useState(false)
    const [claimed, setClaimed] = React.useState(false)
    const [claimedAmount, setClaimedAmount] = React.useState(0)
    const [canClaim, setCanClaim] = React.useState(false)
    const [timerText, setTimerText] = React.useState('')
    const [tooltipMessage, setTooltipMessage] = React.useState()
    const [showBanner, setShowBanner] = React.useState(false)

    const progress =
      (reward.nextLevel ? totalWagered / reward.nextLevel.wagerRequired : 1) *
      100

    const updateRewards = useRoowardsDispatch()

    const levelInfo = {
      d: {
        name: translate('reward.dailyName'),
        description: translate('reward.dailyDescription'),
        claimedTitle: translate('reward.dailyClaimed'),
      },
      w: {
        name: translate('reward.weeklyName'),
        description: translate('reward.weeklyDescription'),
        claimedTitle: translate('reward.weeklyClaimed'),
      },
      m: {
        name: translate('reward.monthlyName'),
        description: translate('reward.monthlyDescription'),
        claimedTitle: translate('reward.monthlyClaimed'),
      },
    } as const

    const claimReward = React.useCallback(() => {
      if (reward.level === 0) {
        setTooltipMessage(translate('reward.youMustReachLevel1'))
        return
      }

      if (claimed) {
        setTooltipMessage(translate('reward.bonusAlreadyClaimed'))
        return
      }

      setClaiming(true)

      api
        .get<any, { claimed: number }>('roowards/claim', {
          params: {
            type: reward.type,
          },
        })
        .then(({ claimed: claimedAmount }) => {
          setClaimed(true)
          setClaimedAmount(claimedAmount)
          // After claiming, set showBanner to true to display the banner
          setShowBanner(true)

          // Remove banner after 3 seconds
          setTimeout(() => {
            setShowBanner(false)
          }, 3000)

          updateRewards(rewards => {
            rewards.rewards.map(r => {
              if (r.type === reward.type) {
                r.lastClaimed = createMoment().toDate()
                r.secondsRemaining = countdownSecondsRemaining[r.type] + 10
              }

              return r
            })
          })

          setClaimResponse(reward.info, claimedAmount)
          // Refetch data after claiming
          refetch()
        })
        .catch(err => {
          if (err.message) {
            setTooltipMessage(err.message)
          }
          setClaimResponse(reward.info, 0)
        })
        .finally(() => {
          setClaiming(false)
        })
    }, [
      reward.type,
      reward.info,
      updateRewards,
      setClaimResponse,
      setTooltipMessage,
    ])

    const handleTooltipClose = React.useCallback(() => {
      setTooltipMessage(undefined)
    }, [])

    React.useEffect(() => {
      let intervalHandle = null

      const onMessage = ({ data }) => {
        if (data.event === 'updateClaim' && data.type === reward.type) {
          setCanClaim(data.canClaim)

          if (data.canClaim) {
            setTimerText('')
            return
          }

          intervalHandle = data.intervalHandle
        } else if (
          data.event === 'updateClaimTimerText' &&
          data.type === reward.type
        ) {
          setTimerText(getTimerText(data.timerText))
        }
      }

      roowardsWorker.addEventListener('message', onMessage)

      roowardsWorker.postMessage({
        event: 'updateClaim',
        type: reward.type,
        lastClaimed: reward.lastClaimed,
        secondsRemaining: reward.secondsRemaining,
        timespan: reward.info.days,
      })

      return () => {
        roowardsWorker.removeEventListener('message', onMessage)

        roowardsWorker.postMessage({
          intervalHandle,
          event: 'clearInterval',
        })
      }
    }, [
      setCanClaim,
      reward.info.days,
      reward.lastClaimed,
      reward.type,
      reward.secondsRemaining,
    ])

    const convertedCurrency = displayCurrencyExchange(
      reward.nextLevel?.wagerRequired - totalWagered || 0,
    )

    const progressBorderRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!progressBorderRef.current) {
        return
      }

      // 335 to account for the level indicator in the way. We don't want to show any progress behind the level indicator.
      const deg = (progress / 100) * 335

      let backgroundImage = ''

      if (deg <= 180) {
        backgroundImage =
          'linear-gradient(' +
          (150 + deg) +
          `deg, transparent 50%, ${uiTheme.palette.neutral[900]} 50%),linear-gradient(145deg, ${uiTheme.palette.neutral[900]} 50%, transparent 50%)`
      } else {
        backgroundImage =
          'linear-gradient(' +
          (deg - 38) +
          `deg, transparent 50%, ${uiTheme.palette.primary.main} 50%),linear-gradient(145deg, ${uiTheme.palette.neutral[900]} 50%, transparent 50%)`
      }

      progressBorderRef.current.style['background-image'] = backgroundImage
    }, [progress])

    const buttonText = React.useMemo(() => {
      if (tooltipMessage && !claimed) {
        return translate('affiliateStats.holdOn')
      }
      if (!canClaim) {
        return timerText
      }

      return translate('reward.claim')
    }, [tooltipMessage, translate, canClaim, claimed, timerText])

    return (
      <div className={classes.RoowardsDialog__rewardItem}>
        <RoowardsClaimedBanner
          title={levelInfo[reward.type].claimedTitle}
          amount={claimedAmount}
          visible={showBanner}
        />
        <div className={classes.RewardItem__rewardContainer}>
          <div style={{ position: 'relative' }}>
            <RoowardsProgress reward={reward} totalWagered={totalWagered} />
          </div>
          <div className={classes.RewardContainer__rewardDetails}>
            <Typography
              variant="body1"
              color={uiTheme.palette.common.white}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {levelInfo[reward.type].name}
            </Typography>
            <Typography
              component="p"
              variant="body4"
              color={uiTheme.palette.neutral[300]}
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {levelInfo[reward.type].description}
            </Typography>
          </div>
        </div>
        <div className={classes.RewardDetails__progressContainer}>
          {!!reward.nextLevel && reward.level < 10 ? (
            <Typography
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightMedium}
              color={uiTheme.palette.neutral[400]}
            >
              {translate('reward.wager')}{' '}
              <Typography
                variant="body4"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                <AnimatedNumber
                  value={convertedCurrency.exchangedAmount}
                  symbol={convertedCurrency.currencySymbol}
                  format="0,0"
                />{' '}
              </Typography>
              {translate('reward.for')}{' '}
              <Typography
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.secondary[500]}
              >
                {translate('reward.level', { level: reward.nextLevel.level })}
              </Typography>
            </Typography>
          ) : (
            <Typography
              variant="body4"
              color={uiTheme.palette.common.white}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {translate('reward.maxLevelReached')}
            </Typography>
          )}
          <Tooltip
            title={tooltipMessage}
            onClose={handleTooltipClose}
            open={!!tooltipMessage}
            disableFocusListener
            disableHoverListener
            disableTouchListener
            placement="left"
          >
            <div>
              <Button
                className={clsx(classes.ClaimButton, {
                  [classes.ClaimButton_timeText]: !!timerText,
                })}
                variant="contained"
                color="primary"
                size="medium"
                loading={claiming}
                label={buttonText}
                onClick={claimReward}
                disabled={!canClaim || claiming}
                onMouseLeave={handleTooltipClose}
              />
            </div>
          </Tooltip>
        </div>
      </div>
    )
  },
)
