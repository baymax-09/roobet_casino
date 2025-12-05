import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGenericAuthDialogStyles = makeStyles(theme =>
  createStyles({
    GenericAuthDialog: {
      position: 'relative',
      flexShrink: 0,
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: uiTheme.palette.neutral[800],

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },

    GenericAuthDialog__content: {
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'scroll',
      padding: uiTheme.spacing(2),
      background: uiTheme.palette.neutral[800],
      height: '100%',
      gap: uiTheme.spacing(4.5),
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        flex: 1,

        justifyContent: 'space-between',
        padding: `${theme.spacing(2.5)} ${theme.spacing(2.75)} ${theme.spacing(
          4,
        )} ${theme.spacing(2.75)}`,
      },
    },

    Logo: {
      width: 140,
      height: 36,

      [uiTheme.breakpoints.up('md')]: {
        width: 189,
        height: 49,
      },
    },

    Form: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: '75vw',
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '29vw',
      },

      [uiTheme.breakpoints.up('xl')]: {
        width: '22vw',
      },
    },

    FormContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    FormContainer__content: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
        justifyContent: 'center',
      },
    },

    Header: {
      color: uiTheme.palette.common.white,

      fontWeight: `${uiTheme.typography.fontWeightBold} !important`,
      fontSize: '1.375rem !important',
      lineHeight: '1.75rem !important',
    },

    Subheader: {
      fontWeight: `${uiTheme.typography.fontWeightMedium} !important`,
      color: uiTheme.palette.neutral[300],
    },

    MainButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
    },

    ErrorMessage: {
      color: uiTheme.palette.error[500],

      fontWeight: uiTheme.typography.fontWeightMedium,
      textAlign: 'center',
    },

    GenericAuthDialog__footer: {
      display: 'flex',
      textAlign: 'center',
      color: uiTheme.palette.neutral[400],
      height: '100%',
      alignItems: 'flex-end',

      [uiTheme.breakpoints.up('md')]: {
        height: 'initial',
        alignItems: 'initial',
        display: 'initial',
      },
    },

    LogoCloseIconContainer: {
      display: 'flex',
    },

    CloseIcon: {
      borderRadius: '12px !important',
      backgroundColor: `${uiTheme.palette.neutral[700]} !important`,
      marginLeft: 'auto !important',

      '&:hover': {
        backgroundColor: `${uiTheme.palette.neutral[600]} !important`,
      },

      [uiTheme.breakpoints.up('md')]: {
        position: 'absolute !important',
        top: 15,
        right: 15,
        borderRadius: '8px !important',
        height: '24px !important',
        width: '24px !important',
        padding: '0px !important',
        backgroundColor: 'transparent !important',

        '&:hover': {
          backgroundColor: `${uiTheme.palette.neutral[800]} !important`,
        },
      },
    },

    BackToLoginButton: {
      '&:hover': {
        color: uiTheme.palette.neutral[300],
      },

      '&:hover > span > svg > path': {
        stroke: uiTheme.palette.neutral[300],
        fill: 'transparent',
      },
    },
  }),
)
