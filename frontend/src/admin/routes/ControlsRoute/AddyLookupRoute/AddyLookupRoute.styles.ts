import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useAddyLookupRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    Input__Header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'end',
    },
    button: {
      position: 'relative',
      marginLeft: theme.spacing(1.25),
    },
    Select: {
      position: 'relative',
      marginRight: theme.spacing(1.25),
    },
    dataContainer: {
      marginTop: theme.spacing(1.875),
    },
  }),
)
