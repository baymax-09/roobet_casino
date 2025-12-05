import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLogoStyles = makeStyles(theme =>
  createStyles({
    root: {
      width: '100%',
      color: theme.palette.secondary.main,
    },
  }),
)
