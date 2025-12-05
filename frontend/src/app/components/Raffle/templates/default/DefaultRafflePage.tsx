import React from 'react'
import numeral from 'numeral'
import { useSelector } from 'react-redux'
import { Trans } from 'react-i18next'
import {
  Typography,
  Button,
  Link,
  theme as uiTheme,
  LinearProgress,
} from '@project-atl/ui'
import { Clock, Ticket, Trophy2 } from '@project-atl/ui/assets'
import moment from 'moment'
import ReactCountdown from 'react-countdown'
import { useMediaQuery } from '@mui/material'

import { SoundToggle } from 'app/components'
import { useTranslate, useIsLoggedIn } from 'app/hooks'
import { convertDateToMonthDayYearFormat, createMoment } from 'common/util'
import { playSound, stopSound, loadSoundScope } from 'app/lib/sound'
import { env } from 'common/constants'

import { DefaultRaffleBanner } from './DefaultRaffleBanner'
import { type RaffleComponentProps } from '../../types'
import { WinnersTable } from './WinnersTable'
import { BannerTitle } from './BannerTitle'
import { WaysToEnter } from './WaysToEnter'

import { useDefaultRafflePageStyles } from './DefaultRafflePage.styles'

const getProgress = (start: Date, end: Date) => {
  const currentTime = createMoment()
  const startTime = createMoment(start)
  const endTime = createMoment(end)

  const totalDuration = endTime.diff(startTime) // Total duration in milliseconds
  const elapsedTime = currentTime.diff(startTime) // Elapsed time in milliseconds

  return Math.min(Math.floor((elapsedTime / totalDuration) * 100), 100)
}

export const DefaultRafflePage: React.FC<RaffleComponentProps> = ({
  raffle,
  reload,
}) => {
  const classes = useDefaultRafflePageStyles()
  const translate = useTranslate()
  const isLoggedIn = useIsLoggedIn()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [playButton, setPlayButton] = React.useState(false)
  /**
   * @todo: Refactor me to only pull necessary properties from user
   * to prevent re-renders.
   */
  const user = useSelector(({ user }) => user)

  const { winners = [], winnersRevealed, payouts } = raffle

  const playAudioFromButton = () => {
    playAudio()
    setPlayButton(true)
  }

  const playAudio = () => {
    if (env.SEASONAL === 'true') {
      playSound('seasonal', 'raffle')
      setPlayButton(true)
    }
  }

  React.useEffect(() => {
    loadSoundScope('seasonal')
    playAudio()
    return () => {
      stopSound('seasonal', 'raffle')
    }
  }, [])

  const showWinners = winners.length > 0 && winnersRevealed

  const progress = getProgress(raffle.start, raffle.end)
  const showWinnersDrawnDate = progress >= 100
  const ticketsOrWinners = isLoggedIn
    ? Math.floor(raffle.tickets?.tickets ?? 0)
    : raffle.winnerCount

  const sections = React.useMemo(
    () => [
      {
        title: translate('raffle.aboutRaffle'),
        component: (
          <Typography
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {translate('raffle.aboutRaffleDesc', {
              winnerCount: raffle.winnerCount,
              prizeAmount: numeral(raffle.amount).format('$0,0.00'),
            })}
          </Typography>
        ),
      },
      {
        title: translate('raffle.waysToEnter'),
        component: <WaysToEnter raffle={raffle} />,
      },
      {
        title: translate('raffle.luckyWinners'),
        component: (
          <WinnersTable
            showWinners={showWinners}
            winners={winners}
            payouts={payouts}
            endDate={raffle.end}
          />
        ),
      },
      {
        title: translate('raffle.otherTerms'),
        component: (
          <ul className={classes.OtherTermsContainer}>
            <li>{translate('raffle.term1')}</li>
            <li>{translate('raffle.term2')}</li>
            <li>{translate('raffle.term3')}</li>
            <li>{translate('raffle.term4')}</li>
            <li>
              <Trans i18nKey="raffle.term5">
                <Link
                  className={classes.Link}
                  href="/terms-and-conditions"
                  target="_blank"
                  color={uiTheme.palette.neutral[400]}
                />
              </Trans>
            </li>
          </ul>
        ),
      },
    ],
    [raffle, isTabletOrDesktop],
  )

  return (
    <div className={classes.RafflePage}>
      {env.SEASONAL === 'true' && (
        <div className={classes.RafflePage__soundToggle}>
          {!!user && <SoundToggle systemName="app" />}
          {!!user && !playButton && (
            <Button
              variant="contained"
              color="primary"
              className={classes.SoundToggle__playAudio}
              onClick={() => playAudioFromButton()}
              label={translate('soundToggle.playAudio')}
            />
          )}
        </div>
      )}

      <DefaultRaffleBanner
        backgroundWrapperClassName={classes.RaffleBanner__backgroundWrapper}
        raffle={raffle}
        reload={reload}
        showOnlyBackground={true}
        showBannerGradientMask={false}
      />

      <div className={classes.RafflePageHeader}>
        <BannerTitle raffleName={raffle.name} />
        <div className={classes.RafflePageHeaderRightContainer}>
          <div className={classes.RafflePageHeaderRightContainer__block}>
            <div
              className={
                classes.RafflePageHeaderRightContainer__block__innerContent
              }
            >
              <Clock
                width={20}
                height={20}
                iconFill={uiTheme.palette.secondary[500]}
              />
              <Typography
                variant="body2"
                color={uiTheme.palette.neutral[300]}
                fontWeight={uiTheme.typography.fontWeightBold}
                whiteSpace="nowrap"
              >
                {translate('raffle.winnersDrawnIn')}
              </Typography>
            </div>
            {showWinnersDrawnDate ? (
              <Typography
                variant="h5"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                {convertDateToMonthDayYearFormat(raffle.end)}
              </Typography>
            ) : (
              <>
                <LinearProgress
                  color="secondary"
                  value={progress}
                  sx={{
                    marginTop: uiTheme.spacing(0.5),
                    marginBottom: uiTheme.spacing(0.5),
                  }}
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
              </>
            )}
          </div>
          <div className={classes.RafflePageHeaderRightContainer__block}>
            <div
              className={
                classes.RafflePageHeaderRightContainer__block__innerContent
              }
            >
              {isLoggedIn ? (
                <Ticket
                  width={20}
                  height={20}
                  iconFill={uiTheme.palette.secondary[500]}
                />
              ) : (
                <Trophy2
                  width={20}
                  height={20}
                  iconFill={uiTheme.palette.secondary[500]}
                />
              )}
              <Typography
                variant="body2"
                color={uiTheme.palette.neutral[300]}
                fontWeight={uiTheme.typography.fontWeightBold}
                whiteSpace="nowrap"
              >
                {isLoggedIn
                  ? translate('raffle.yourTickets')
                  : translate('raffle.raffleWinners')}
              </Typography>
            </div>
            <Typography
              variant="h5"
              color={uiTheme.palette.common.white}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {ticketsOrWinners}
            </Typography>
          </div>
        </div>
      </div>
      {sections.map(({ title, component }) => (
        <div className={classes.RafflePage__section}>
          <Typography
            {...(isTabletOrDesktop
              ? {
                  variant: 'h5',
                }
              : {
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                })}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.common.white}
          >
            {title}
          </Typography>
          {component}
        </div>
      ))}
    </div>
  )
}
