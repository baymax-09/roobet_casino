import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useAddRemoveItemsStyles = makeStyles(theme =>
  createStyles({
    root: {
      width: '100%',
    },

    itemGroup: {
      marginTop: theme.spacing(1),
      height: '200px',
      overflowY: 'scroll',
      width: '100%',
      borderRadius: '4px',
      border: '1px solid #ccc',
      padding: theme.spacing(2),
    },

    itemListRow: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      marginBottom: theme.spacing(0.5),
      alignItems: 'center',
      height: 40,
    },

    removeButton: {
      marginLeft: 'auto',
    },
  }),
)
