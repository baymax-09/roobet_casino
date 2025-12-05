import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useTransactionsStyles = makeStyles(theme =>
  createStyles({
    paper: {
      padding: theme.spacing(2),
    },

    expandedRow: {
      background: '#f5f5f5',
    },

    userLink: {
      color: '#03a9f4',
    },

    gameName: {
      textTransform: 'capitalize',
    },

    profit: {
      fontWeight: theme.typography.fontWeightMedium,
    },

    negative: {
      color: theme.palette.red.main,
    },

    positive: {
      color: '#4caf50',
    },
  }),
)
