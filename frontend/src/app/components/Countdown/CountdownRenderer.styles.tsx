import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { BANNER_BORDER_RADIUS } from '../SlotPotato/constants'

interface StylesProps {
  textShadowColor: string
}

export const useCountdownRendererStyles = makeStyles(theme =>
  createStyles({
    CountdownContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      color: uiTheme.palette.common.white,
    },

    Countdown__textShadow: ({ textShadowColor }: StylesProps) => ({
      textShadow: `0px 2px 0px ${textShadowColor}`,
    }),

    CountdownDigitsContainer: {
      display: 'flex',
      gap: theme.spacing(1),
    },

    CountdownDigit: {
      backgroundColor: uiTheme.palette.common.black,
      padding: uiTheme.spacing(0.5),
      borderRadius: 8,
    },

    Explainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 24,
      borderRadius: `0px 0px ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px`,
    },
  }),
)
