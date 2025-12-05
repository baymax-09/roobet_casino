import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import { Clock, Ticket, Trophy2 } from '@project-atl/ui/assets'
import ReactCountdown from 'react-countdown'
import moment from 'moment'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'

import { getCachedSrc } from 'common/util'
import { useTranslate, useIsLoggedIn } from 'app/hooks'

import { useSharedRaffleStyles } from '../shared'
import { type RaffleComponentProps } from '../../types'
import { BannerTitle } from './BannerTitle'

import { useDefaultRaffleBannerStyles } from './DefaultRaffleBanner.styles'

export const DefaultRaffleBanner: React.FC<RaffleComponentProps> = ({
  raffle,
  reload,
  showOnlyBackground = false,
  showBannerGradientMask = true,
  backgroundWrapperClassName,
}) => {
  const classes = {
    ...useDefaultRaffleBannerStyles(),
    ...useSharedRaffleStyles({
      withRibbon: false,
      bannerBackgroundImage: getCachedSrc({
        src: raffle.bannerImage,
        height: 150,
        quality: 85,
      }),
      showBannerGradientMask,
    }),
  }

  const translate = useTranslate()
  const isLoggedIn = useIsLoggedIn()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const ticketsOrWinners = isLoggedIn
    ? Math.floor(raffle.tickets?.tickets ?? 0)
    : raffle.winnerCount

  const { winnersRevealed, winnerCount } = raffle

  const viewResults = winnerCount > 0 && winnersRevealed

  return (
    <RouterLink
      to={`/raffle/${raffle.slug}`}
      className={classes.DefaultRaffleBanner}
    >
      {!showOnlyBackground && (
        <>
          <div className={classes.RaffleBannerLeftContentWrapper}>
            <BannerTitle
              raffleName={raffle.name}
              bannerTitleProps={{
                ...(isTabletOrDesktop
                  ? { variant: 'h5' }
                  : { fontSize: '1.5rem', lineHeight: '2rem' }),
              }}
            />
            <div className={classes.RaffleBannerButtonStack}>
              <Button
                variant="contained"
                color={viewResults ? 'tertiary' : 'primary'}
                size="medium"
                label={
                  viewResults
                    ? translate('raffle.viewResults')
                    : translate('raffle.learnMore')
                }
                fullWidth={!isTabletOrDesktop}
              />
              <div className={classes.RaffleBannerButtonStack__timerContainer}>
                <Clock
                  width={16}
                  height={16}
                  iconFill={uiTheme.palette.secondary[500]}
                />
                <ReactCountdown
                  onComplete={() => {
                    reload()
                  }}
                  date={moment(raffle.end).unix() * 1000}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <Typography
                      variant="body4"
                      color={uiTheme.palette.common.white}
                      fontWeight={uiTheme.typography.fontWeightBold}
                      whiteSpace="nowrap"
                      minWidth={viewResults ? 'initial' : '5rem'}
                    >
                      {days > 0
                        ? translate('raffle.dayIncludedTimes', {
                            days,
                            hours,
                            minutes,
                          })
                        : translate('raffle.dayExcludedTimes', {
                            hours,
                            minutes,
                            seconds,
                          })}
                    </Typography>
                  )}
                />
              </div>
            </div>
          </div>
          <div className={classes.MyTicketsContainer}>
            {isLoggedIn ? (
              <Ticket
                width={16}
                height={16}
                iconFill={uiTheme.palette.secondary[500]}
              />
            ) : (
              <Trophy2
                width={16}
                height={16}
                iconFill={uiTheme.palette.secondary[500]}
              />
            )}

            <div className={classes.MyTicketsContainer__text}>
              <Typography
                order={isLoggedIn ? 1 : 2}
                component="span"
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.neutral[300]}
              >
                {isLoggedIn
                  ? translate('raffle.yourTickets')
                  : translate('raffle.raffleWinners')}
              </Typography>{' '}
              <Typography
                order={isLoggedIn ? 2 : 1}
                component="span"
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.common.white}
              >
                {ticketsOrWinners}
              </Typography>
            </div>
          </div>
        </>
      )}
      {/* Banner Background Image */}
      <div
        className={clsx(
          classes.RaffleBannerBackgroundWrapper,
          backgroundWrapperClassName,
        )}
      >
        <div className={classes.RaffleBanner__background}></div>
      </div>
    </RouterLink>
  )
}
