import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useXRPRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(1.875),
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },

    submitButton: {
      // the button is slightly unaligned by default
      position: 'static',
      top: 10,
      marginLeft: 0,
      marginTop: theme.spacing(1.875),

      [theme.breakpoints.up('sm')]: {
        position: 'relative',
        marginLeft: theme.spacing(1.25),
        marginTop: 'inherit',
      },
    },
  }),
)
