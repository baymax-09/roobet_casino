import React from 'react'
import moment from 'moment-timezone'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import { useCurrencyDisplay, useTranslate } from 'app/hooks'
import { api, createMoment, getCachedSrc } from 'common/util'
import reloadIcon from 'assets/images/roowards_reload.png'
import { AnimatedNumber, Skeleton } from 'mrooi'
import { useRoowards } from 'app/context'

import { getTimerText } from './RoowardClaimRow'
import { RoowardsClaimedBanner } from './RoowardClaimBanner'
import { useRoowardsContentStyles } from './RoowardsContent'

import { useRoowardClaimRowStyles } from './RoowardClaimRow.styles'

interface ReloadProps {
  setClaimResponse: (claimedInfo: any, claimedAmount: number) => void
}

export const Reload: React.FC<ReloadProps> = React.memo(props => {
  const classes = useRoowardClaimRowStyles({})
  const contentClasses = useRoowardsContentStyles()

  const translate = useTranslate()
  const displayCurrencyExchange = useCurrencyDisplay()
  const { refetch } = useRoowards()

  const [expired, setExpired] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [reload, setReload] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [canClaim, setCanClaim] = React.useState(false)
  const [timerText, setTimerText] = React.useState('')
  const [showBanner, setShowBanner] = React.useState(false)

  React.useEffect(() => {
    api.get('/roowards/reload').then(({ reload }) => {
      setReload(reload)
      setLoading(false)
    })
  }, [])

  React.useEffect(() => {
    if (!reload || expired) {
      return
    }

    const claimable = !reload.lastClaimedAt

    if (!claimable) {
      const lastClaimedAt = createMoment(reload.lastClaimedAt)

      const interval = setInterval(() => {
        const now = createMoment()
        const diff = now.diff(lastClaimedAt)

        if (diff >= reload.interval * 1000) {
          setCanClaim(true)
          clearInterval(interval)
          return
        }

        const duration = moment.duration(reload.interval * 1000 - diff)
        // const diffLeft = (reload.interval * 1000) - diff
        const days = duration.days()
        const hours = duration.hours()
        const minutes = duration.minutes()
        const seconds = duration.seconds()

        let timerText = ''

        if (days > 0) {
          timerText += `${days.toString().padStart(2, '0')}`
        }

        if (hours > 0) {
          timerText += `${days >= 1 ? ':' : ''}${hours
            .toString()
            .padStart(2, '0')}`
        }

        if (minutes > 0) {
          timerText += `${hours >= 1 ? ':' : ''}${minutes
            .toString()
            .padStart(2, '0')}`
        }

        if (seconds > 0) {
          timerText += `${minutes >= 1 ? ':' : ''}${seconds
            .toString()
            .padStart(2, '0')}`
        }

        if (!timerText.length) {
          timerText = 'Preparing reward...'
        }

        setTimerText(getTimerText(timerText))
      }, 700)

      return () => {
        clearInterval(interval)
      }
    } else {
      setCanClaim(claimable)
    }
  }, [reload, setCanClaim, expired])

  const onClaimReload = async () => {
    setBusy(true)

    try {
      const { success, expired, lastClaimedAt, amount, totalClaims } =
        await api.post('roowards/reload/claim', {
          id: reload._id,
        })

      if (!success) {
        if (expired) {
          setExpired(true)
        }
      } else {
        setReload(reload => ({
          ...reload,
          lastClaimedAt,
          totalClaims,
        }))

        setCanClaim(false)

        // After claiming, set showBanner to true to display the banner
        setShowBanner(true)

        // Remove banner after 3 seconds
        setTimeout(() => {
          setShowBanner(false)
        }, 3000)

        props.setClaimResponse(
          {
            reload: true,
            name: 'Recharge',
          },
          amount,
        )
        // Refetch data after claiming
        refetch()
      }
    } catch (error) {}

    setBusy(false)
  }

  const convertedCurrency = displayCurrencyExchange(reload?.amount ?? 0)
  const claimsLeft = reload?.maxClaims - reload?.totalClaims ?? 0

  const buttonText = React.useMemo(() => {
    if (expired) {
      return translate('reload.expired')
    }
    if (!canClaim) {
      return timerText || translate('reload.loading')
    }

    return translate('reload.claim')
  }, [canClaim, timerText, expired])

  return (
    <div className={classes.RoowardsDialog__rewardItem}>
      {!loading ? (
        <>
          <RoowardsClaimedBanner
            title={translate('reload.reloadClaimed')}
            amount={convertedCurrency.exchangedAmount}
            visible={showBanner}
          />
          <div className={classes.RewardItem__rewardContainer}>
            <div style={{ position: 'relative' }}>
              <div className={classes.RoowardsProgressIndicator}>
                <div className={classes.RoowardsImageContainer}>
                  <div
                    className={classes.RewardContainer__rewardIcon}
                    style={{
                      backgroundImage: `url(${getCachedSrc({
                        src: reloadIcon,
                      })})`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={classes.RewardContainer__rewardDetails}>
              <Typography
                variant="body1"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                {translate('reload.recharge')}
              </Typography>
              <Typography
                component="p"
                variant="body4"
                color={uiTheme.palette.neutral[300]}
                fontWeight={uiTheme.typography.fontWeightMedium}
              >
                {translate('reload.rechargeDesc')}
              </Typography>
            </div>
          </div>
          <div className={classes.RewardDetails__progressContainer}>
            <Typography
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightMedium}
              color={uiTheme.palette.neutral[400]}
            >
              <Typography
                variant="body4"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                <Typography
                  variant="body4"
                  fontWeight={uiTheme.typography.fontWeightBold}
                  color={uiTheme.palette.secondary[500]}
                >
                  <AnimatedNumber
                    value={convertedCurrency.exchangedAmount}
                    symbol={convertedCurrency.currencySymbol}
                    format="0,0"
                  />{' '}
                </Typography>
                / {claimsLeft}
              </Typography>{' '}
              {claimsLeft === 1
                ? translate('reload.rechargeLeft')
                : translate('reload.rechargesLeft')}
            </Typography>
            <Button
              className={clsx(classes.ClaimButton, {
                [classes.ClaimButton_timeText]: !!timerText,
              })}
              variant="contained"
              color="primary"
              size="medium"
              loading={busy}
              label={buttonText}
              onClick={onClaimReload}
              disabled={!canClaim || busy}
            />
          </div>
        </>
      ) : (
        <>
          <div className={contentClasses.RoowardsSkeletons__topContainer}>
            <Skeleton
              variant="rectangular"
              width={88}
              height={88}
              animation="wave"
            />
            <div className={contentClasses.RoowardsSkeletons__rightContainer}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={24}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height={64}
                animation="wave"
              />
            </div>
          </div>
          <div className={contentClasses.RoowardsSkeletons__bottomContainer}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={44}
              animation="wave"
            />
          </div>
        </>
      )}
    </div>
  )
})
