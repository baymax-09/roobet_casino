import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useReportsRouteStyles = makeStyles(() =>
  createStyles({
    root: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      maxWidth: '100%',
    },

    inputs: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      marginBottom: '10px',

      '& > *': {
        margin: '5px 0',
      },
    },

    table: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflowY: 'hidden',
      overflowX: 'auto',
      maxWidth: '100%',
    },
  }),
)
