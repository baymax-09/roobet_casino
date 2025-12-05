import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useUsernameStyles = makeStyles(theme =>
  createStyles({
    username: {
      color: theme.palette.primary.main,

      fontWeight: theme.typography.fontWeightBold,
      textDecoration: 'none',
      padding: '10px 0',
      display: 'inline-block',
    },
  }),
)
