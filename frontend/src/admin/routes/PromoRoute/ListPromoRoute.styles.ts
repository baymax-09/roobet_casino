import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListPromoRouteStyles = makeStyles(theme =>
  createStyles({
    ListPromo_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    ListPromoActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
