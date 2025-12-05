import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useScreenFlashStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'none',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 100,
      background: theme.palette.primary.light,
      opacity: 0,
      pointerEvents: 'none',
    },
  }),
)
