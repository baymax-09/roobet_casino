import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useOverviewStyles = makeStyles(theme =>
  createStyles({
    root: {
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexDirection: 'column',
      maxHeight: 'none',

      [theme.breakpoints.up('md')]: {
        maxHeight: '100vh',
      },
    },

    viewContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      width: '100%',
      overflow: 'hidden',

      [theme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    userDetailsContainer: {
      height: '100%',
      overflow: 'auto',
      boxSizing: 'border-box',
      width: '100%',
    },

    userNotesContainer: {
      display: 'none',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      height: '100%',
      marginLeft: theme.spacing(2),
      width: '350px',

      [theme.breakpoints.up('md')]: {
        display: 'flex',
        flexDirection: 'column',
      },
    },

    title: {
      fontFamily: '"courier new" !important',
    },

    userIdContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },

    copyUserIdButton: {
      marginLeft: '10px',
      position: 'relative',
      bottom: '2px',
      color: theme.palette.primary.dark,
    },
  }),
)
