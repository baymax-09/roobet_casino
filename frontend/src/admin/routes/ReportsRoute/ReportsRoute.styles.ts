import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useReportsRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      height: '100%',
      width: '100%',
    },

    title: {
      marginBottom: '16px',
    },

    header: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      borderBottom: `solid 1px ${theme.palette.gray.light}`,
      width: '100%',
      paddingBottom: '16px',
    },

    dropdownContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },

    reportContainer: {
      padding: '16px 0',
      flex: 1,
      display: 'flex',
    },

    reportSelector: {
      minWidth: '350px',
    },
  }),
)
