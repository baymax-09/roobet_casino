import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListGameCategoriesDialogStyles = makeStyles(theme =>
  createStyles({
    Button__actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      margin: `${theme.spacing(1.25)} 0px`,
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
