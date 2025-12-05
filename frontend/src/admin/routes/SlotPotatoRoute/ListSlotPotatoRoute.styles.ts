import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListSlotPotatoRouteStyles = makeStyles(theme =>
  createStyles({
    ListPotatoes_addMarginBot: {
      marginBottom: theme.spacing(1),
    },

    ListPotatoActions_addMargin: {
      margin: `0 ${theme.spacing(1)} 0`,
    },
  }),
)
