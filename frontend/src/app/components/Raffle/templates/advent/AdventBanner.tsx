import React from 'react'
import moment from 'moment'
import numeral from 'numeral'
import { Button, Typography } from '@mui/material'

import ticket from 'assets/images/icons/ticket.svg'
import { createMoment } from 'common/util'
import { useTranslate } from 'app/hooks'

import { useAdventBannerStyles } from './AdventBanner.styles'

interface AdventBannerProps {
  featureImageSrc: string
  showCountdown: boolean
  serverTime?: string
  loading?: boolean
  renderButton?: boolean
  viewWinnersOnClick?: () => void
  compact?: boolean
  tickets?: number
  endDate?: Date | null
}

const AdventBanner: React.FC<AdventBannerProps> = ({
  featureImageSrc,
  serverTime,
  renderButton = false,
  loading,
  showCountdown = true,
  viewWinnersOnClick,
  compact = false,
  tickets = 0,
  endDate = null,
}) => {
  const classes = useAdventBannerStyles({
    compact,
    featureImageSrc,
  })

  const [countdown, setCountdown] = React.useState<string | null>(null)
  const translate = useTranslate()

  React.useEffect(() => {
    if (loading || !showCountdown) {
      return
    }

    const tick = () => {
      const now = createMoment()
      const next = createMoment(serverTime).add(1, 'd').startOf('day')

      const diff = next.diff(now)
      const duration = moment.duration(diff)

      const hours = duration.hours().toString().padStart(2, '0')
      const minutes = duration.minutes().toString().padStart(2, '0')
      const seconds = duration.seconds().toString().padStart(2, '0')
      setCountdown(`${hours}h ${minutes}m ${seconds}s`)
    }

    tick()
    const interval = setInterval(tick, 900)

    return () => {
      clearInterval(interval)
    }
  }, [loading, serverTime, setCountdown, showCountdown])

  const lastDay = endDate ? moment(endDate).subtract(1, 'd').date() : null

  return (
    <div className={classes.AdventBanner}>
      <div className={classes.AdventBanner__background} />
      {showCountdown ? (
        <>
          <div className={classes.AdventBanner__message}>
            <img alt="Ticket" src={ticket} />
            <Typography
              variant="h1"
              color="deprecated.textPrimary"
              classes={{ h1: classes.Message__ticketCount }}
            >
              {numeral(tickets).format('0,0')}{' '}
              {translate('holidayBanner.tickets')}
            </Typography>
          </div>
          {createMoment().format('D') !== `${lastDay}` && (
            <Typography
              variant="h3"
              color="textSecondary"
              classes={{ h3: classes.AdventBanner__countdown }}
            >
              {translate('holidayBanner.nextReward')}: {countdown}
            </Typography>
          )}
          {createMoment().format('D') === `${lastDay}` && (
            <Typography
              variant="h3"
              color="textSecondary"
              classes={{ h3: classes.AdventBanner__countdown }}
            >
              {translate('holidayBanner.winnersDrawnToday')}
            </Typography>
          )}
        </>
      ) : renderButton ? (
        <Button
          size="large"
          color="secondary"
          variant="contained"
          onClick={viewWinnersOnClick}
          className={classes.AdventBanner__showWinners}
        >
          {translate('holidayBanner.viewWinners')}
        </Button>
      ) : null}
    </div>
  )
}

export default React.memo(AdventBanner)
