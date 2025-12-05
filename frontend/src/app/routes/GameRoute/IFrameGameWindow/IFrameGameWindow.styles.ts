import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useIFrameGameWindowStyles = makeStyles(() =>
  createStyles({
    root: {
      width: '100%',
      height: '100%',

      '& iframe': {
        position: 'relative',
        zIndex: 5,
        width: '100% !important',
        height: '100% !important',
        overflow: 'hidden',
        verticalAlign: 'middle',
      },
    },

    loader: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
  }),
)
