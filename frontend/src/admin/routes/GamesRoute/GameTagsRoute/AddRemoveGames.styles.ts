import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useAddRemoveGamesStyles = makeStyles(() =>
  createStyles({
    root: {
      width: '100%',
    },

    gameGroup: {
      marginTop: '10px',
      height: '200px',
      overflowY: 'scroll',
      width: '100%',
      borderRadius: '4px',
      border: '1px solid #ccc',
      padding: '8px',
    },

    gameListRow: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      marginBottom: '3px',
      alignItems: 'center',
      height: 40,
    },

    removeButton: {
      marginLeft: 'auto',
    },
  }),
)
