import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useTPGameBlocksRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '15px',
    },
    title: {
      marginRight: '10px',
      marginBottom: '10px',
    },
    form: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',

      '& > *': {
        margin: '8px 0',
      },
    },
    activeDisables: {
      marginTop: theme.spacing(2),
    },
    formContainer: {
      marginLeft: theme.spacing(5),
      padding: theme.spacing(3),
      height: '280px',
    },
    pageContainer: {
      display: 'flex',
      flexGrow: 1,
    },
  }),
)
