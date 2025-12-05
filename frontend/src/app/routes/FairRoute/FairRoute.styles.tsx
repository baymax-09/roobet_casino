import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFairRouteStyles = makeStyles(() =>
  createStyles({
    FairRoute: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      margin: '0 auto',
      padding: uiTheme.spacing(2),
      alignItems: 'center',
      justifyContent: 'center',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    FairRouteContainer: {
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    FairRouteContent: {
      display: 'flex',
      flexDirection: 'column',
    },

    ComponentContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      padding: uiTheme.spacing(2),
      height: '100%',
      width: '100%',
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '0px 0px 12px 12px',

      '& h3': {
        paddingBottom: uiTheme.spacing(1.25),
      },

      '& p': {
        paddingBottom: uiTheme.spacing(1.5),
        wordWrap: 'break-word',

        '&:last-child': {
          paddingBottom: 0,
        },
      },

      '& ul,ol': {
        paddingLeft: uiTheme.spacing(3),

        li: {
          wordWrap: 'break-word',
        },
      },

      '& ul': {
        listStyleType: 'disc',
        paddingBottom: uiTheme.spacing(1.5),
      },

      '& ol': {
        listStyleType: 'decimal',
      },

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
      },
      '& a': {
        '&:hover': {
          color: uiTheme.palette.common.white,
        },
      },
    },

    IFrameContainer: {
      position: 'relative',
      height: '34rem',

      // // Used to assure the iframe will have a 16:9 aspect ratio
      [uiTheme.breakpoints.up('md')]: {
        paddingBottom: '56.25%',
        height: '100%',
      },
    },

    IFrame: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '12px',
    },
  }),
)
