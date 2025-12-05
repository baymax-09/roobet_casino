import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLeftToWagerTooltipStyles = makeStyles(theme =>
  createStyles({
    '@keyframes leftWagerTooltipEnter': {
      '0%': {
        opacity: 1,
      },

      '100%': {
        opacity: 0,
      },
    },

    Tooltip: {
      position: 'relative',
      backgroundColor: theme.palette.green.main,
      color: '#fff',
      boxShadow: theme.shadows[1],
      fontSize: 11,

      fontWeight: theme.typography.fontWeightMedium,
      letterSpacing: 1,
      fontVariant: 'tabular-nums',

      '&:after': {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1,
        content: '" "',
        background: '#fff',
        opacity: 1,
        animation: '$leftWagerTooltipEnter 0.3s linear forwards',
      },
    },

    Tooltip_pending: {
      background: '#474b79',
    },
  }),
)
