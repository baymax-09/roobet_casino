import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDialogLoaderStyles = makeStyles(theme =>
  createStyles({
    DialogLoader: {
      outline: 'none',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    },

    DialogLoader_backgroundColor: {
      backgroundColor: 'rgba(46, 50, 88, 0.50) !important',
    },

    DialogLoader__progress: {
      flexShrink: 0,
    },

    ErrorDialog: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    },

    ErrorDialog__dialog: {
      flex: 1,
      marginBottom: theme.spacing(1),
    },
  }),
)
