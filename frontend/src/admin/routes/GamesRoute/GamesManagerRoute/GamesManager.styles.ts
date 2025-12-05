import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameManagerRouteStyles = makeStyles(theme =>
  createStyles({
    GameManager_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    GameTagActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
