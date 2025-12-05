import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCStyles = makeStyles(theme =>
  createStyles({
    root: {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },

    header: {
      boxSizing: 'border-box',
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      padding: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      color: theme.palette.primary.main,
      borderBottom: '1px solid rgb(0 0 0 / 5%)',
    },

    tabs: {
      flex: 1,
    },

    refreshButton: {
      flexShrink: 0,
    },

    content: {
      flex: 1,
      overflow: 'auto',
      padding: theme.spacing(1),
    },
  }),
)
