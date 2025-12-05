import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBTCRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: '15px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    section: {
      margin: '30px 0',
      '&:first-of-type': {
        marginTop: '0',
      },
    },
    submitReProcessButton: {
      // the button is slightly unaligned by default
      position: 'static',
      marginLeft: 0,
      marginTop: 15,
      display: 'block',

      // make the button layout properly vertically on small screens
      [theme.breakpoints.up('sm')]: {
        marginLeft: 10,
        marginTop: 0,
        position: 'relative',
        display: 'inline',
        top: 10,
      },
    },

    submitTransferButton: {
      marginTop: '5px',
    },
    inputContainer: {
      margin: '10px 0',
    },
  }),
)
