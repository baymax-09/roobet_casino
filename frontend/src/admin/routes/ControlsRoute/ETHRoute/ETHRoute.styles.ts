import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useETHRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: 15,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },

    submitButton: {
      // the button is slightly unaligned by default
      position: 'static',
      top: 10,
      marginLeft: 0,
      marginTop: 15,

      [theme.breakpoints.up('sm')]: {
        position: 'relative',
        marginLeft: 10,
        marginTop: 'inherit',
      },
    },
  }),
)
