import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBlockedDepositTabStyles = makeStyles(theme =>
  createStyles({
    BlockedDepositTab: ({ isDesktop }: { isDesktop: boolean }) => ({
      width: '100%',
      height: isDesktop ? 350 : '100%',
      paddingTop: 115,
      background: '#E0E0E0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),

    BlockedDepositTab__logo: {
      width: 36,
      height: 36,
      marginBottom: theme.spacing(1.5),
    },

    BlockedDepositTab__message: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 360,
    },
  }),
)
