import React from 'react'
import { Link } from 'react-router-dom'
import { Typography } from '@mui/material'

import { createMoment } from 'app/util'
import { useTranslate, useIsLoggedIn } from 'app/hooks'
import { getCachedSrc } from 'common/util'

import { RaffleBannerRibbons, useSharedRaffleStyles } from '../shared'
import { type AdventRaffleState, type RaffleComponentProps } from '../../types'

import { useAdventRaffleBannerStyles } from './AdventRaffleBanner.styles'

export const AdventRaffleBanner: React.FC<RaffleComponentProps> = ({
  raffle,
}) => {
  const classes = {
    ...useAdventRaffleBannerStyles(),
    ...useSharedRaffleStyles({
      withRibbon: true,
      bannerBackgroundImage: getCachedSrc({ src: raffle.bannerImage }),
    }),
  }

  const translate = useTranslate()
  const isLoggedIn = useIsLoggedIn()
  const [raffleState, setRaffleState] =
    React.useState<AdventRaffleState | null>(null)
  const [stateText, setStateText] = React.useState<string | undefined>(
    undefined,
  )

  const myTickets = isLoggedIn && raffle.tickets ? raffle.tickets.tickets : 0
  const { winners, winnersRevealed } = raffle

  React.useEffect(() => {
    if (!raffle) {
      setRaffleState(null)
      return
    }

    const startTime = createMoment(raffle.start)
    const endTime = createMoment(raffle.end)

    let timeout = null

    const tick = () => {
      const now = createMoment()

      if (now.isBefore(startTime)) {
        setRaffleState('starting')
        setStateText(startTime.format('MM/DD, hA'))
      } else if (now.isAfter(endTime)) {
        setRaffleState('over')
        return
      } else if (now.isAfter(startTime) && now.isBefore(endTime)) {
        setRaffleState('active')
        setStateText(endTime.format('MM/DD'))
      }

      // @ts-expect-error we need to figure out how to remove NodeJS types from our types
      timeout = setTimeout(tick, 1000)
    }

    tick()

    return () => {
      // @ts-expect-error we need to figure out how to remove NodeJS types from our types
      clearTimeout(timeout)
    }
  }, [raffle])

  return (
    <Link className={classes.RaffleBanner} to={`/raffle/${raffle.slug}`}>
      <div className={classes.RaffleBanner__backgroundWrapper}>
        <div className={classes.RaffleBanner__background}></div>
      </div>

      <Typography
        variant="h5"
        color="deprecated.textPrimary"
        classes={{ h5: classes.RaffleBanner__title }}
      >
        {raffle.name}
      </Typography>
      <Typography
        variant="body1"
        color="deprecated.textPrimary"
        classes={{ body1: classes.RaffleBanner__subtitle }}
      >
        {!raffleState ? (
          'Loading...'
        ) : raffleState === 'active' ? (
          <>
            {translate('raffle.winnersDrawnOn')} {stateText}
          </>
        ) : raffleState === 'starting' ? (
          <>
            {translate('raffle.raffleStartsAt')} {stateText}
          </>
        ) : winners.length > 0 && winnersRevealed ? (
          translate('raffle.winnersHaveBeenDrawn')
        ) : (
          translate('raffle.winnersDrawnSoon')
        )}
      </Typography>
      <div className={classes.RaffleBanner__feature}>
        <div
          className={classes.Feature__image}
          style={{
            backgroundImage: `url(${getCachedSrc({
              src: raffle.heroImage,
            })})`,
          }}
        />
      </div>
      <RaffleBannerRibbons
        winnerCount={raffle.winnerCount}
        tickets={myTickets}
      />
    </Link>
  )
}
