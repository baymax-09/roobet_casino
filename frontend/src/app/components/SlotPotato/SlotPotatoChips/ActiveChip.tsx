import React from 'react'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import Lottie from 'react-lottie'
import { useHistory } from 'react-router'

import { type SlotGame } from 'app/gql'
import { useTranslate } from 'app/hooks'
import fireAnimationData from 'app/lottiefiles/slot-potato-fire.json'

import { CountdownChip } from './CountdownChip'
import { BANNER_BORDER_RADIUS, TEXT_SHADOW_COLOR } from '../constants'

const FireAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: fireAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
} as const

export const useActiveChipStyles = makeStyles(theme =>
  createStyles({
    ActiveChip: {
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      height: 'fit-content',
      borderRadius: BANNER_BORDER_RADIUS,
      gap: theme.spacing(1),
      padding: theme.spacing(1),
      backgroundColor: TEXT_SHADOW_COLOR,
    },

    TopBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      width: 'fit-content',
      position: 'absolute',
      top: 0,
      left: '50%',
      backgroundColor: '#F8950D',
      borderRadius: `0px 0px ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px`,
      whiteSpace: 'nowrap',
      transform: 'translateX(-50%)',
      zIndex: 2,
    },

    ThreeTimesRewards: {
      textShadow: '0px 1px 0px rgba(153, 56, 30, 0.25)',
    },

    FireGIF: {
      position: 'absolute',
      bottom: -24,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      width: '100%',
    },

    GameThumbnail: {
      borderRadius: BANNER_BORDER_RADIUS,
    },
  }),
)

export interface CountdownChipProps {
  game: SlotGame
}

export const ActiveChip: React.FC<CountdownChipProps> = ({ game }) => {
  const classes = useActiveChipStyles()
  const translate = useTranslate()
  const history = useHistory()
  const { identifier } = game

  return (
    <div className={classes.ActiveChip}>
      <div className={classes.TopBanner}>
        <Typography
          className={classes.ThreeTimesRewards}
          variant="body4"
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.common.white}
        >
          {translate('slotPotato.3TimesRewards')}
        </Typography>
      </div>
      <CountdownChip
        game={game}
        applyBlur={false}
        gameThumbnailClassName={classes.GameThumbnail}
      />
      <Button
        color="primary"
        variant="contained"
        onClick={() => history.push(`/game/${identifier}`)}
        label={translate('slotPotato.playNow')}
      />
      <div className={classes.FireGIF}>
        <Lottie options={FireAnimationOptions} width="100%" height={120} />
      </div>
    </div>
  )
}
