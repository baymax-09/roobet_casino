import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type Theme } from '@mui/material'

export const useWalletTemplateStyles = makeStyles<Theme>((theme: Theme) =>
  createStyles({
    WalletContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',

      [theme.breakpoints.down('sm')]: {
        display: 'block',
      },
    },

    CurrencyContainer: {
      flex: 2,

      [theme.breakpoints.down('sm')]: {
        flex: 1,
      },
    },

    NetworkContainer: {
      flex: 1,
      marginLeft: theme.spacing(2),

      [theme.breakpoints.down('sm')]: {
        flex: 1,
        marginLeft: 0,
        marginTop: theme.spacing(2),
      },
    },

    NetworkSelector__selectedNetwork: {
      fontWeight: theme.typography.fontWeightMedium as number,
      color: 'white',
      fontSize: '0.875rem',
      lineHeight: '1.42',
    },

    NetworkSelector: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'start',
      gap: theme.spacing(1),
    },
  }),
)
