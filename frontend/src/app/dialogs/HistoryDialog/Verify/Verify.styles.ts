import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useVerifyStyles = makeStyles(() =>
  createStyles({
    Verify: {
      marginTop: 15,
    },

    Verify__formInput: {
      width: '100%',
      marginBottom: 15,
      position: 'relative',
    },

    Verify__loading: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(25, 25, 57, 0.65)',
      borderRadius: 12,
      zIndex: 3,
    },
  }),
)
