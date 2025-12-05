import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBalanceDropdownStyles = makeStyles(theme =>
  createStyles({
    BalanceDropdown: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'start',
      height: 24,
      width: '100%',
    },

    BalanceDropdown__balanceImg: {
      width: '1.25rem',
      height: '1.25rem',
    },

    BalanceDropdown__cryptoName: {
      display: 'flex',
      marginLeft: `${theme.spacing(1)} !important`,
      marginRight: `${theme.spacing(0.5)} !important`,
      overflow: 'hidden',
    },

    BalanceDropdown__balance: {
      marginLeft: 'auto',
    },

    PaymentIcons: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.75),
      marginLeft: theme.spacing(1),
    },

    PaymentIcons__icon: {
      width: 18,
      height: 18,
    },
  }),
)
