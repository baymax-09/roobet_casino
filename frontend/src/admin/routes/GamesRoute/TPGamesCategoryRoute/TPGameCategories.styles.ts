import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListGameCategoriesRouteStyles = makeStyles(theme =>
  createStyles({
    ListCategoriesActions__addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
