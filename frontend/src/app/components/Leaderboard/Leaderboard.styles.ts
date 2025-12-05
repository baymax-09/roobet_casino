import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useLeaderboardStyles = makeStyles(theme =>
  createStyles({
    LeaderBoard__loadingSkeletons: {
      display: 'flex',
      overflow: 'hidden',
      flexWrap: 'nowrap',
      padding: '21px 0',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(0.25),
      },
    },

    LoadingSkeletons__skeleton: {
      minWidth: '242px',
      height: '180px',

      [uiTheme.breakpoints.up('md')]: {
        width: '100%',
        height: '72px',
      },
    },

    Banner__title: {
      fontSize: '18px',

      fontWeight: theme.typography.fontWeightMedium,
      marginLeft: '20px',

      [uiTheme.breakpoints.up('md')]: {
        fontSize: '20px',
        marginLeft: '20px',
      },
    },

    LeaderBoard__board: {
      position: 'relative',
    },

    LeaderBoard__banner: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: 0,
        flexDirection: 'row',
      },
    },

    LeaderBoard__tab: {
      width: '50%',
      '&.MuiTab-root': {
        backgroundColor: uiTheme.palette.neutral[800],
      },

      [uiTheme.breakpoints.up('md')]: {
        width: 'initial',
      },
    },

    Tabs: {
      order: 2,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        order: 1,
      },
    },

    Timespan: {
      order: 1,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: 'initial',
      },
    },

    ResultRecords: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'scroll',
      borderRadius: '0px 12px 12px 12px',
      // Hide scrollbar for IE, Edge and Firefox
      '-ms-overflow-style': 'none',
      scrollbarWidth: 'none',
      gap: uiTheme.spacing(0.5),

      // Hide scrollbar for Chrome, Safari and Opera
      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        gap: 0,
      },
    },

    EmptyBets__blurredBackground: {
      position: 'absolute',
      inset: 0,
      backgroundColor: `${uiTheme.palette.neutral[800]}BF`,
      backdropFilter: 'blur(8px)',
      borderRadius: '0px 12px 12px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    EmptyBets__content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.75),
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(2)}`,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        padding: `${uiTheme.spacing(1)} 0px`,
        width: '228px',
      },
      [uiTheme.breakpoints.up('lg')]: {
        padding: `${uiTheme.spacing(1)} 0px`,
        width: '300px',
      },
    },

    EmptyBets__gameImage: {
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '2rem',
      height: '2rem',
      margin: '0 auto',
      borderRadius: '4px',
    },

    EmptyBets__text: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    WinRecord__container: {
      background: 'red',
      display: 'flex',
      backgroundColor: uiTheme.palette.neutral[700],

      [uiTheme.breakpoints.up('md')]: {
        '&:not(:last-child)': {
          borderBottom: `2px solid ${uiTheme.palette.neutral[800]}`,
        },
      },
    },

    WinRecord: {
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',

      [uiTheme.breakpoints.up('md')]: {
        height: '4.5rem',
        flexDirection: 'row',
      },
    },

    WinRecord__userDetails: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: uiTheme.spacing(2),
      padding: `0px ${uiTheme.spacing(2)}`,
      height: '72px',
      width: '100%',
      borderBottom: `2px solid ${uiTheme.palette.neutral[800]}`,

      [uiTheme.breakpoints.up('md')]: {
        flex: 1,
        height: '100%',
        borderBottom: 'none',
        width: '25%',
      },
    },

    WinRecord__betDetails: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      alignItems: 'center',

      [uiTheme.breakpoints.up('md')]: {
        width: '62.76%',
        flexDirection: 'row',
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '75%',
      },
    },

    BetDetails__metric: {
      display: 'flex',
      flexDirection: 'row',
      fontWeight: 500,
      height: '100%',
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(2)}`,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'column',
        width: '37.24%',
        justifyContent: 'center',
        borderLeft: `2px solid  ${uiTheme.palette.neutral[800]}`,
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '33.33%',
      },
    },

    Metric__spotLight: {
      display: 'flex',
      flexDirection: 'row',
      order: -1,

      [uiTheme.breakpoints.up('md')]: {
        alignItems: 'flex-start',
        flexDirection: 'column',
      },
    },

    BetDetails__coinIcon: {
      verticalAlign: 'text-top',
      width: '1rem',
      height: '1rem',
      display: 'inline-block',
    },

    PayoutContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: uiTheme.spacing(0.625),
      marginLeft: 'auto',

      [uiTheme.breakpoints.up('md')]: {
        marginLeft: 'initial',
      },
    },
  }),
)
