import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLoadingOverlayStyles = makeStyles(() =>
  createStyles({
    Loading: {
      position: 'fixed',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      overflow: 'hidden',
      zIndex: 10000,
    },

    Loading__progress: {
      flexShrink: 0,
      opacity: '0.7',
      height: '3px',
      position: 'fixed',
      left: '0',
      right: '0',
      zIndex: 9999,
    },
  }),
)
