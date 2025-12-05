import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useTPUpdateGamesCategoriesRouteStyles = makeStyles(theme =>
  createStyles({
    Dialog: {
      margin: theme.spacing(1),
    },

    Dialog__footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      margin: `${theme.spacing(2)} 0px`,
    },

    Dialog__categoryTitle: {
      display: 'flex',
      justifyContent: 'center',
      margin: theme.spacing(1.25),
    },

    Button__addMargin: {
      marginRight: theme.spacing(1.25),
    },
  }),
)
