import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListKOTHsRouteStyles = makeStyles(theme =>
  createStyles({
    ListKOTH_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    ListKOTHActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
