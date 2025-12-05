import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useSecurityTabStyles = makeStyles(theme =>
  createStyles({
    AccountDialog__securityTab: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    SessionButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        gap: uiTheme.spacing(1.5),
      },
    },

    PasswordInputsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',
    },

    SecurityTab__resultPaper: {
      padding: theme.spacing(1, 2),

      fontWeight: theme.typography.fontWeightMedium,
    },

    Link: {
      '&:hover': {
        color: uiTheme.palette.neutral[300],
      },
    },

    SecurityTab__oAuthToggleGroupItem: {
      marginRight: 8,
    },

    dialogs: {
      display: 'none',
    },
  }),
)
