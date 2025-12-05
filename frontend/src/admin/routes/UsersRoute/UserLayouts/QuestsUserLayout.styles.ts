import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useQuestsUserLayoutStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      overflowY: 'scroll',
    },

    formControl: {
      marginBottom: theme.spacing(1),
    },
  }),
)
