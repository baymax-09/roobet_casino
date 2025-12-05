import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useCrashRouteStyles = makeStyles(theme =>
  createStyles({
    canvasContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
    },

    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    controlsContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      flexShrink: 0,
      overflow: 'hidden',
      background: '#0d0e20',
      order: 3,

      [uiTheme.breakpoints.up('md')]: {
        width: 300,
        order: 'initial',
      },
    },

    innerControlsContainer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'auto',
    },

    crashContainer: {
      position: 'relative',
      overflow: 'hidden',
      height: 300,
      order: 1,

      [uiTheme.breakpoints.up('md')]: {
        flex: 1,
        height: 'initial',
        order: 'initial',
      },
    },

    history: {
      display: 'initial',
      flexShrink: 0,
      width: '100%',
      order: 2,

      [uiTheme.breakpoints.up('md')]: {
        display: 'none',
      },
    },

    tabs: {
      flexShrink: 0,

      '&:last-child': {
        marginBottom: theme.spacing(2),
      },
    },

    maxProfit: {
      fontSize: 12,

      fontWeight: theme.typography.fontWeightMedium,
      opacity: 0.5,
      marginRight: theme.spacing(1),

      '&:last-child': {
        marginRight: 10,
      },
    },

    leaderboard: {
      position: 'absolute',
      top: 48,
      right: 0,
      left: 0,
      bottom: 0,
      background: '#0d0e20',
      zIndex: 10,
      overflow: 'hidden',
    },

    lazyLoader: {
      display: 'flex',
      justifyContent: 'center',
      padding: theme.spacing(2),
    },

    lazyLoaderProgress: {
      width: '75%',
    },

    loader: {
      marginRight: 4,
      background: 'rgba(0, 0, 0, 0.4)',
      flexShrink: 0,
      display: 'block',
    },

    crashLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      zIndex: 15,

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    koth: {
      marginTop: theme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: `0px ${theme.spacing(3)}`,
        marginTop: theme.spacing(3),
      },
    },
  }),
)
