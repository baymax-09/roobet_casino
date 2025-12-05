import makeStyles from '@mui/styles/makeStyles'

export const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    margin: `${theme.spacing(2)} 0`,
  },

  resetKYCContainer: {
    display: 'flex',
    alignItems: 'center',
  },

  resetInputFields: {
    marginLeft: theme.spacing(4),
    marginRight: 'auto',
  },
}))
