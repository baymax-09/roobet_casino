import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useChatRainStyles = makeStyles(theme =>
  createStyles({
    ChatRain: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: theme.spacing(0, 1.5),
      zIndex: 10,
      flexShrink: 0,
      background: uiTheme.palette.neutral[900],
      overflow: 'hidden',
    },

    ChatRain_visible: {
      boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.2)',
      padding: theme.spacing(1.5, 1.5),
    },

    ChatRain__message: {
      flex: 1,
      overflow: 'hidden',
    },

    Message__title: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    Message__subtitle: {
      color: uiTheme.palette.neutral[400],

      fontWeight: theme.typography.fontWeightMedium,
      fontSize: '0.75rem',
      lineHeight: '1rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    ChatRain__rainClock: {
      flexShrink: 0,
      height: 40,
      width: 40,
      borderRadius: '100%',
      overflow: 'hidden',
      background: uiTheme.palette.primary.main,
      marginRight: 10,
    },

    RainClock__clockCircle: {
      position: 'relative',
      width: '100%',
      height: '100%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    RainClock__clockBorder: {
      position: 'relative',
      textAlign: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '100%',
      backgroundColor: uiTheme.palette.primary.main,
      backgroundImage: `linear-gradient(91deg, transparent 50%, ${uiTheme.palette.neutral[800]} 50%), linear-gradient(90deg, ${uiTheme.palette.neutral[800]} 50%, transparent 50%)`,
    },

    RainClock__clockText: {
      background: uiTheme.palette.neutral[800],
      borderRadius: '100%',
      width: '80%',
      height: '80%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      fontWeight: theme.typography.fontWeightBold,
      color: theme.palette.common.white,
      userSelect: 'none',
    },

    ChatRain__button: {
      '& > span': {
        fontSize: '0.875rem !important',
        lineHeight: '1rem !important',
      },
    },
  }),
)
