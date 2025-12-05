import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

export const useDarkModeToggleStyles = makeStyles(() =>
  createStyles({
    themeContainer: {
      display: 'flex',
      alignItems: 'center',
      padding: 10,
    },

    themeText: {
      color: 'white',
    },
  }),
)
