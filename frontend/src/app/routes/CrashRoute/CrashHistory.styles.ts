import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useCrashHistoryStyles = makeStyles(theme =>
  createStyles({
    '@keyframes animatedHistory': {
      '0%': {
        opacity: 0,
        transform: 'scale(1.3)',
      },

      '100%': {
        opacity: 1,
        transform: 'scale(1)',
      },
    },

    root: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      flexWrap: 'nowrap',
      overflow: 'hidden',
      position: 'relative',

      [uiTheme.breakpoints.up('sm')]: {
        '&:after': {
          position: 'absolute',
          content: '" "',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          background: 'linear-gradient(to left, #0d0e20, transparent)',
          pointerEvents: 'none',
          zIndex: 5,
        },
      },
    },

    game: {
      flexShrink: 0,
    },

    button: {
      minWidth: 'initial',
      padding: '6px 8px',

      fontWeight: theme.typography.fontWeightBold,

      [uiTheme.breakpoints.up('sm')]: {
        padding: 6,
      },
    },

    green: {
      color: theme.palette.green.main,
    },

    red: {
      color: theme.palette.red.main,
    },

    loader: {
      marginRight: 4,
      background: 'rgba(0, 0, 0, 0.4)',
      flexShrink: 0,
      display: 'block',
    },

    animated: {
      [uiTheme.breakpoints.up('sm')]: {
        opacity: 0,
        animation:
          '$animatedHistory 1s cubic-bezier(0, 0.74, 0.25, 1) forwards',
      },
    },
  }),
)
