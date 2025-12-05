import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useWalletSettingsStyles = makeStyles(theme =>
  createStyles({
    WalletSettings: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '504px',
        },
      },
    },

    WalletSettings_content: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      margin: `${theme.spacing(2)} ${theme.spacing(2)} 0`,
      borderRadius: 12,
      backgroundColor: uiTheme.palette.neutral[700],
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(3),

      '& > :not(:first-child)': {
        alignSelf: 'center',
      },

      [uiTheme.breakpoints.up('md')]: {
        borderRadius: 0,
        margin: 0,
        padding: uiTheme.spacing(3),
      },
    },

    WalletSettings__actions: {
      display: 'flex',
      justifyContent: 'center',
      background: uiTheme.palette.neutral[900],
      height: 80,
      alignItems: 'center',
    },

    WalletSettings__button: {
      width: 'calc(100% - 32px)',
      height: 48,
      margin: uiTheme.spacing(2),
      '&.MuiButton-contained:hover.Mui-disabled': {
        backgroundColor: uiTheme.palette.neutral[700],
      },
    },

    Button__label: {
      fontSize: 16,
      fontWeight: 600,
    },

    Button__transition: {
      transition: '.25s ease-in',
    },
  }),
)
