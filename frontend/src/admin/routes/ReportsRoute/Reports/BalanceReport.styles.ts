import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBalanceReportStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },

    actionsContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginTop: '5px',

      '& > *': {
        marginLeft: '5px',
      },

      '& > *:first-of-type': {
        marginLeft: '0',
      },
    },

    json: {
      marginTop: theme.spacing(2),
    },
  }),
)
