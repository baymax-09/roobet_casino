import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { getRoowardsIcon } from 'app/util'
import { type Level, type RoowardTimespan } from 'app/types'

import { useRoowardClaimRowStyles } from './RoowardClaimRow.styles'

export const countdownSecondsRemaining = {
  /* eslint-disable id-length */
  d: 86400,
  w: 604800,
  m: 2592000,
  // eslint-enable id-length
}

interface RoowardDialogClaimRowProps {
  reward: {
    level: Level
    type: RoowardTimespan
    nextLevel?: any
  }
  totalWagered?: number
}

const ProgressIndicator: React.FC<
  React.PropsWithChildren<RoowardDialogClaimRowProps>
> = ({ reward, totalWagered, children }) => {
  const classes = useRoowardClaimRowStyles({})

  const progress =
    (reward.nextLevel
      ? (totalWagered ?? 0) / reward.nextLevel.wagerRequired
      : 1) * 100

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

  if (!totalWagered) {
    return <>{children}</>
  }

  return (
    <div ref={progressBorderRef} className={classes.RoowardsProgressIndicator}>
      {children}
    </div>
  )
}

export const RoowardsProgress: React.FC<RoowardDialogClaimRowProps> = ({
  reward,
  totalWagered,
}) => {
  const classes = useRoowardClaimRowStyles({
    progressHidden: totalWagered === undefined,
  })

  return (
    <ProgressIndicator reward={reward} totalWagered={totalWagered}>
      <div className={classes.RoowardsImageContainer}>
        <div
          className={classes.RewardContainer__rewardIcon}
          style={{
            backgroundImage: `url(${getRoowardsIcon({
              type: reward.type,
              level: reward.level ?? 0,
            })})`,
          }}
        />
        <div className={classes.RewardIcon__levelContainer}>
          <div className={classes.LevelIndicator}>
            <Typography
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightBlack}
              color={uiTheme.palette.neutral[200]}
            >
              {reward.level}
            </Typography>
          </div>
        </div>
      </div>
    </ProgressIndicator>
  )
}
