import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListGamesRouteStyles = makeStyles(theme =>
  createStyles({
    ListGames_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    ListGamesActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
