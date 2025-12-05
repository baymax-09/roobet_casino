import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { type SxThemedPropsRecord, theme as uiTheme } from '@project-atl/ui'

type GameRouteStylesProps = Partial<{
  realMode: boolean
  favorited: boolean | null
  logo: string
}>

export const styles = {
  ActionsButton: {
    padding: 0,

    '&[data-favorited="true"] .Ui-root': {
      fill: uiTheme.palette.error[500],
      '& .Ui-stroke': {
        stroke: uiTheme.palette.error[500],
      },
    },
    '&[data-favorited="false"]:hover .Ui-stroke': {
      stroke: uiTheme.palette.common.white,
    },
  },
} satisfies SxThemedPropsRecord

// TODO partial props here is bad but this stylesheet is shared amongst multiple components
export const useGameRouteStyles = makeStyles(theme =>
  createStyles({
    GameRoute: {
      paddingBottom: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
        '&:has([data-view-mode="theatre"])': {
          paddingTop: 0,
        },
      },
    },

    GameRouteContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      margin: '0 auto',
      maxWidth: uiTheme.breakpoints.values.lg,
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(2),

        '&:has([data-view-mode="theatre"])': {
          paddingTop: 0,
          maxWidth: '100%',
          width: 'min-content',
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        gap: uiTheme.spacing(3),
      },
    },

    ToggleFormGroup: {
      gap: uiTheme.spacing(1),
      alignItems: 'center',
    },

    root: {
      position: 'relative',
    },

    // Do not remove.
    displayMobile: {},

    theatre: {
      padding: 0,
    },

    fullscreen: {
      '& $container': {
        height: '100vh !important',
        width: '100vw !important',
      },
    },

    mobile: {
      padding: 0,

      '& $container': {
        minHeight: 'unset',
        height: 'auto',
        maxWidth: '100%',
      },

      '& $footer': {
        borderRadius: 0,
      },
    },

    container: {
      display: 'flex',
      flexDirection: 'column',
      transition: '.3s ease',
      margin: '0 auto',
      borderRadius: '12px',
      backgroundColor: uiTheme.palette.neutral[900],
    },

    game: {
      overflow: 'hidden',
      position: 'relative',
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: uiTheme.palette.neutral[900],
      marginInline: 'auto',
      minHeight: '221px',

      [uiTheme.breakpoints.up('md')]: {
        borderRadius: '12px 12px 0 0',
        background: 'initial',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        aspectRatio: '16 / 9',
        width: '100%',
        minHeight: 'initial',

        '[data-view-mode="theatre"] &': {
          height: 'var(--roo-game-frame-height)',
          width: 'calc(var(--roo-game-frame-height) * 16 / 9)',
          maxWidth: '100%',
        },
      },
    },

    sizer: {
      '&:not($displayMobile)': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        width: '100%',
        aspectRatio: '16 / 9',
        display: 'flex',
        alignItems: 'center',
      },
    },

    wrapper: {
      width: '100%',
      height: '100%',

      '& iframe': {
        width: '100% !important',
        height: '100% !important',
        verticalAlign: 'middle',
      },
    },

    loginOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      background: 'rgba(26, 28, 57, 0.95)',
    },

    loginOverlayTitle: {
      color: '#fff',
      fontSize: 20,
      lineHeight: '20px',

      fontWeight: theme.typography.fontWeightBold,
      marginBottom: 20,
    },

    gameOverlay: {
      padding: theme.spacing(1),
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: '16 / 9',
      width: '100%',
    },

    errorOverlay: {
      padding: theme.spacing(1),

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,

      [uiTheme.breakpoints.up('md')]: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    },

    errorMessageContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 10,
    },

    footer: {
      display: 'flex',
      alignItems: 'center',
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(2)}`,

      backgroundColor: uiTheme.palette.neutral[900],
      height: 56,
      overflow: 'hidden',
      borderRadius: '0 0 12px 12px',
      position: 'relative',
      borderTop: `2px solid ${uiTheme.palette.neutral[800]}`,
    },

    footerContainer: ({ logo }: GameRouteStylesProps) => ({
      marginLeft: 'auto',
      marginRight: 'auto',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'flex-end',
      backgroundSize: '120px 30px',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      height: '34px',

      [uiTheme.breakpoints.up('md')]: {
        backgroundImage: `url(${logo})`,
        justifyContent: 'space-between',
      },
    }),

    mode: {
      display: 'flex',
      alignItems: 'center',
    },

    actions: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      gap: uiTheme.spacing(1),
    },

    ButtonContainer: {
      width: '268px',
      borderRadius: '16px',
      padding: uiTheme.spacing(0.5),
      backgroundColor: uiTheme.palette.neutral[900],
      gap: uiTheme.spacing(0.5),
    },

    mobileView: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),

      '& $actions': {
        justifyContent: 'center',
      },
    },

    mobileImage: {
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '128px',
      height: '128px',
      maxWidth: 236,
      margin: '0 auto',
      borderRadius: '12px',

      '& $actions': {
        '& > button': {
          margin: theme.spacing(0, 1),
        },
      },
    },

    Icon_hover: {
      '&:hover': {
        '& .Ui-fill': {
          fill: uiTheme.palette.common.white,
        },
      },
    },

    descDesktop: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(1.5),
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: 0,
      },
    },
  }),
)
