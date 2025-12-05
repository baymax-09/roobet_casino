import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSportsbookLauncherStyles = makeStyles(() =>
  createStyles({
    container: {
      // Matches background of Betby's theme.
      background: '#000025',
      minHeight: '100vh',
    },

    loadingContainer: {
      display: 'flex',
      width: '100%',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
)
