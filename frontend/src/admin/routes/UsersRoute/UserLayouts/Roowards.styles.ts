import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useRoowardsStyles = makeStyles(() =>
  createStyles({
    root: {
      overflow: 'auto',
      width: '100%',
    },
    paper: {
      padding: '20px',
    },
    stats: {
      // TODO AFTER MUI5-UPGRADE Deprecated to Remove.
      '& .MuiListItem-root': {
        paddingLeft: '0px',
      },
    },
    actions: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginTop: '16px',
    },
  }),
)
