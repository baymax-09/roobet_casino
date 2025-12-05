import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useHideEmptyWalletStyles = makeStyles(() =>
  createStyles({
    HideEmptyWallets: {
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      padding: uiTheme.spacing(1.5),
      width: '100%',
      height: 80,

      [uiTheme.breakpoints.up('md')]: {
        height: 64,
      },
    },

    HideEmptyWallets__formText: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
    },

    HideEmptyWallets__form: {
      width: '100%',
      marginLeft: 'unset', // formControl with a checkbox defaults to a negative margin, I guess
      marginRight: 'unset',
      '& > span:first-child': {
        paddingRight: 'unset',
      },
    },

    HideEmptyWallets__formLabel: {
      paddingLeft: uiTheme.spacing(0.75),
    },
  }),
)
