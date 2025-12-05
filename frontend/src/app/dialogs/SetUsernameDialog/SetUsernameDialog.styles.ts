import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSetUsernameDialogStyles = makeStyles(theme =>
  createStyles({
    content: {
      background: '#fff',
    },

    alert: {
      marginBottom: theme.spacing(2),
    },
  }),
)
