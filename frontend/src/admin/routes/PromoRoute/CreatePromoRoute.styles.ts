import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useCreatePromoRouteStyles = makeStyles(() =>
  createStyles({
    CreatePromo__formContainer: {
      maxHeight: '100vh',
      overflowY: 'auto',
      padding: '15px',
      display: 'flex',
      maxWidth: 'max-content',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      maxWidth: '270px',

      '& > *': {
        margin: '2px 0',
      },
    },

    noPromos: {
      padding: '50px 20px',
      boxSizing: 'border-box',
    },

    table: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
    },
    tableContainer: {
      marginTop: '40px',
    },
    tableBody: {
      '& > tr > td': {
        padding: 5,
      },
    },
    redRow: {
      background: '#ffb8a5',
    },
    actionButtons: {
      margin: '6px',
    },
  }),
)
