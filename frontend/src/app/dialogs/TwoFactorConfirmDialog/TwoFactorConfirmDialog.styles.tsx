import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useTwoFactorConfirmDialogStyles = makeStyles(() =>
  createStyles({
    TwoFactorConfirmDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '480px',
        },
      },
    },

    TwoFactorConfirmDialog__content: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(1.5),
      margin: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(2),
        borderRadius: 0,
        margin: 0,
      },
    },

    ButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      zIndex: 2,
      justifyContent: 'flex-end',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
        flexDirection: 'row',
        alignItems: 'flex-end',
      },
    },

    ButtonContainer__button: {
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: '128px',
      },
    },

    QRContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[700],
      borderRadius: '12px',
      alignSelf: 'center',
      width: 'fit-content',
    },

    QR: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '8rem',
      height: '8rem',
      borderRadius: '12px',
      position: 'relative',
      overflow: 'hidden',
    },

    QR__image: {
      width: '8.75rem',
      height: '8.75rem',
    },

    InputsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
      },
    },
  }),
)
