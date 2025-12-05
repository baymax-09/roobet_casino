import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface SharedRaffleParams {
  bannerBackgroundImage?: string
  withRibbon?: boolean
  showBannerGradientMask?: boolean
}

const BANNER_BORDER_RADIUS = 6

export const useSharedRaffleStyles = makeStyles(() =>
  createStyles({
    RafflePage__container: {
      padding: uiTheme.spacing(2),
      overflow: 'hidden',
      overscrollBehavior: 'contain',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    RafflePage: {
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
      fontSize: '14px',
      lineHeight: '19px',
      color: '#cecece',
    },

    RaffleBanner__container: {
      marginBottom: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        marginBottom: uiTheme.spacing(3),
      },
    },

    RaffleBanner: (props: SharedRaffleParams) => ({
      marginBottom: uiTheme.spacing(3),
      borderRadius: BANNER_BORDER_RADIUS,
      boxShadow: '0px 4px 6px rgb(20 18 43 / 60%)',
      display: 'block',
      padding: uiTheme.spacing(1.5),
      position: 'relative',
      textDecoration: 'none',
      textAlign: 'center',
      [uiTheme.breakpoints.up('sm')]: {
        '&:hover': {
          '& $RaffleBanner__background': {
            transform: 'scale(1.07)',
          },
        },
      },
      [uiTheme.breakpoints.up('md')]: {
        padding: props.withRibbon
          ? `30px ${uiTheme.spacing(2)}`
          : uiTheme.spacing(2),
      },
    }),

    RaffleBanner__backgroundWrapper: {
      overflow: 'hidden',
      display: 'flex',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      borderRadius: BANNER_BORDER_RADIUS,
    },

    RaffleBanner__background: props => ({
      width: '100%',
      height: '100%',
      backgroundImage: `url(${props.bannerBackgroundImage})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      transition: '.3s ease',
      transform: 'scale(1)',

      ...(props.showBannerGradientMask && {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
          background: `linear-gradient(0deg, ${uiTheme.palette.neutral[800]} 0%, rgba(25, 25, 57, 0.00) 100%)`,
          zIndex: 2,

          [uiTheme.breakpoints.up('md')]: {
            background: `linear-gradient(90deg, ${uiTheme.palette.neutral[800]} 0%, rgba(25, 25, 57, 0.00) 100%)`,
          },
        },
      }),
    }),

    RaffleBanner__title: {
      zIndex: 3,
      position: 'relative',
      fontWeight: 700,
      textShadow: '1px 1px 3px black',
      lineHeight: 1,
      marginBottom: uiTheme.spacing(1),
      marginTop: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        fontSize: 26,
      },

      [uiTheme.breakpoints.up('lg')]: {
        marginTop: 'initial',
      },
    },

    RaffleBanner__subtitle: {
      textShadow: '1px 1px 3px black',
      fontWeight: 700,
      opacity: 0.7,
      lineHeight: 1,
      [uiTheme.breakpoints.up('md')]: {
        fontSize: 18,
      },
    },
  }),
)
