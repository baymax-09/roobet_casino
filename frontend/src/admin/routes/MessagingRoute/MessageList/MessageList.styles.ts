import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMailboxStyles = makeStyles(theme =>
  createStyles({
    ListMessages_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    ListMessagesActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
