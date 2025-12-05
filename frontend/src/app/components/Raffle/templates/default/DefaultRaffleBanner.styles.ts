import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDefaultRaffleBannerStyles = makeStyles(theme =>
  createStyles({
    DefaultRaffleBanner: {
      display: 'flex',
      flexDirection: 'column-reverse',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      textDecoration: 'none',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    RaffleBannerLeftContentWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      flexGrow: 1,
      width: '100%',
      position: 'relative',
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    RaffleBannerButtonStack: {
      display: 'flex',
      padding: uiTheme.spacing(0.5),
      gap: uiTheme.spacing(0.5),
      borderRadius: '16px',
      backgroundColor: uiTheme.palette.neutral[900],
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: 'fit-content',
      },
    },

    RaffleBannerButtonStack__timerContainer: {
      display: 'flex',
      gap: uiTheme.spacing(1),
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${uiTheme.spacing(1.25)} ${uiTheme.spacing(2)}`,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: '136px',
      },
    },

    RaffleBannerBackgroundWrapper: {
      overflow: 'hidden',
      display: 'flex',
      height: '10.25rem',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        height: 'auto',
      },
    },

    MyTicketsContainer: {
      position: 'absolute',
      top: 24,
      right: 24,
      padding: `${uiTheme.spacing(1.25)} ${uiTheme.spacing(2)}`,
      display: 'flex',
      gap: uiTheme.spacing(1),
      alignItems: 'center',
      borderRadius: '12px',
      backgroundColor: uiTheme.palette.neutral[900],
      zIndex: 2,
    },
    MyTicketsContainer__text: {
      display: 'flex',
      gap: uiTheme.spacing(0.25),
    },
  }),
)
