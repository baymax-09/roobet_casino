import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

export const useSlotPotatoFormStyles = makeStyles(theme =>
  createStyles({
    formHeader: {
      marginBottom: theme.spacing(2),
    },
    formContainer: {
      padding: theme.spacing(3),
    },
    selectedGamesHead: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(1),
    },
    gridRow: {
      backgroundColor: theme.palette.grey[700],
      marginBottom: '1px',
      padding: theme.spacing(1),
    },
    gridItem: {
      display: 'flex',
      alignItems: 'center',
    },
    gameDurationContainer: {
      maxWidth: '300px',
    },
    actionButtons: {
      margin: theme.spacing(1),
    },
  }),
)
