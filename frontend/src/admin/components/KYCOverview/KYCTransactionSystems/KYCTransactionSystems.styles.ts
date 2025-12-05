import makeStyles from '@mui/styles/makeStyles'

export const useKYCTransactionSystemsStyles = makeStyles(theme => ({
  KYCTransactionSystems: {
    padding: theme.spacing(2),
    margin: `${theme.spacing(2)} 0`,
  },

  KYCTransactionSystems__container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'baseline',
  },

  KYCTransactionSystems__systemItem: {
    display: 'flex',
  },
}))
