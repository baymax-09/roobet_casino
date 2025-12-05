import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListRafflesRouteStyles = makeStyles(theme =>
  createStyles({
    tabs: {
      marginBottom: theme.spacing(1),
    },

    actionButtons: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
