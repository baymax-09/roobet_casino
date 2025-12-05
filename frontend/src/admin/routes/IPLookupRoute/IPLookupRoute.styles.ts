import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useIPLookupRouteStyles = makeStyles(() =>
  createStyles({
    root: {
      maxHeight: '100vh',
      overflowY: 'auto',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '270px',
    },
    button: {
      marginTop: '5px',
      marginBottom: '5px',
    },
    tableContainer: {
      marginTop: '40px',
      maxWidth: '700px',
    },
    tableBody: {
      '& > tr > td': {
        padding: 5,
      },
    },
  }),
)
