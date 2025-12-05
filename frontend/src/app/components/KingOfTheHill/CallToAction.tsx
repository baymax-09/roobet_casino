import React from 'react'
import clsx from 'clsx'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import ReactCountdown from 'react-countdown'
import moment from 'moment'
import { useHistory } from 'react-router'

import { useDialogsOpener, useTranslate } from 'app/hooks'
import { type KOTHFlavor, type KOTHState } from 'common/types'
import { Skeleton } from 'mrooi'
import { CASINO_SLOTS_LINK } from 'app/routes/CasinoPageRoute'

interface CallToActionProps {
  showTimerWithButton: boolean
  timerText: Date | null
  whichRoo: KOTHFlavor
  leaderboardButton: boolean
  kothState: KOTHState | null
  loading: boolean
}

export const useCallToActionStyles = makeStyles(theme =>
  createStyles({
    CallToActionContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    },

    CallToActionContainer_order: {
      order: 3,
    },

    CallToActionContainer_showTimerWithButton: {
      borderRadius: '16px',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.25),
      backgroundColor: uiTheme.palette.neutral[900],
      justifyContent: 'space-between',
    },

    CountdownContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
  }),
)

export const CallToAction: React.FC<CallToActionProps> = ({
  showTimerWithButton,
  timerText,
  whichRoo,
  leaderboardButton,
  kothState,
  loading: loadingProps,
}) => {
  const classes = useCallToActionStyles()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const history = useHistory()

  const kingRoo = whichRoo === 'king'
  const ended = kothState === 'ended'

  const loading = !timerText || loadingProps

  return (
    <>
      {loading ? (
        <Skeleton
          className={classes.CallToActionContainer_order}
          width={220}
          height={56}
          variant="rectangular"
          animation="wave"
        />
      ) : (
        <div
          className={clsx(
            classes.CallToActionContainer,
            classes.CallToActionContainer_order,
            {
              [classes.CallToActionContainer_showTimerWithButton]:
                showTimerWithButton,
            },
          )}
        >
          {showTimerWithButton && (
            <div className={classes.CountdownContainer}>
              <ReactCountdown
                date={moment(timerText).unix() * 1000}
                renderer={({ formatted: { hours, minutes, seconds } }) => (
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.common.white}
                    fontWeight={uiTheme.typography.fontWeightBlack}
                    width={ended ? 'fit-content' : '93px'}
                  >
                    {ended
                      ? translate('kothBanner.ended')
                      : translate('kothBanner.times', {
                          hours,
                          minutes,
                          seconds,
                        })}
                  </Typography>
                )}
              />
              <Typography
                variant="body4"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightMedium}
              >
                {translate('kothBanner.timeLeft')}
              </Typography>
            </div>
          )}
          <Button
            color="primary"
            variant="contained"
            {...(!leaderboardButton && {
              onClick: () =>
                history.push(kingRoo ? CASINO_SLOTS_LINK : '/crash'),
            })}
            {...(leaderboardButton && {
              onClick: () => openDialog('kothLeaderboard'),
            })}
            size="medium"
            label={
              // The "ended" condition is for showing the text "Leaderboard" on the homepage instead of "Play Now".
              leaderboardButton || ended
                ? translate('kothBanner.leaderboard')
                : translate('kothBanner.playNow')
            }
          />
        </div>
      )}
    </>
  )
}
