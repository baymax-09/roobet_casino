import React from 'react'
import moment from 'moment'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Locked } from '@project-atl/ui/assets'
import ReactCountdown from 'react-countdown'

import { type SlotGame } from 'app/gql'
import { useTranslate } from 'app/hooks'

import { CountdownChip } from './CountdownChip'
import { LockIndicator } from './LockIndicator'

export const useLockedChipStyles = makeStyles(theme =>
  createStyles({
    ContentContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
)

export interface LockedChipProps {
  game: SlotGame
  startDateTime: Date
  gameDuration: number
  showFullProgressBar?: boolean
}

export const LockedChip: React.FC<LockedChipProps> = ({
  game,
  startDateTime,
  gameDuration,
  showFullProgressBar = false,
}) => {
  const classes = useLockedChipStyles()
  const translate = useTranslate()
  const timeRemaining = (moment(startDateTime).unix() - moment().unix()) * 1000

  // Needs to be 0-100.
  const [progress, setProgress] = React.useState(
    (timeRemaining / gameDuration) * 100,
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      const timeRemaining =
        (moment(startDateTime).unix() - moment().unix()) * 1000
      const progressState = 100 - (timeRemaining / gameDuration) * 100
      setProgress(progressState)
    }, 1000)

    return () => clearInterval(interval)
  }, [startDateTime, gameDuration])

  return (
    <CountdownChip game={game}>
      <div className={classes.ContentContainer}>
        {!showFullProgressBar && (
          <Typography
            variant="body4"
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.common.white}
          >
            {translate('slotPotato.nextGameIn')}
          </Typography>
        )}
        <LockIndicator
          progress={showFullProgressBar ? 100 : progress}
          icon={
            <Locked
              iconFill={uiTheme.palette.secondary[500]}
              width={16}
              height={16}
            />
          }
        />
        {!showFullProgressBar && (
          <ReactCountdown
            date={Date.now() + timeRemaining}
            renderer={({ hours, minutes, seconds }) => (
              <Typography
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.common.white}
              >
                {translate('slotPotato.times', {
                  hours,
                  minutes,
                  seconds,
                })}
              </Typography>
            )}
          />
        )}
      </div>
    </CountdownChip>
  )
}
