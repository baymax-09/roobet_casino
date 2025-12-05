import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDOGERouteStyles = makeStyles(() =>
  createStyles({
    root: {
      padding: '15px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },

    submitButton: {
      // the button is slightly unaligned by default
      position: 'relative',
      top: '10px',
      marginLeft: '10px',
    },
  }),
)
