import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameRowSkeletonStyles = makeStyles(theme =>
  createStyles({
    GameSkeleton: {
      display: 'flex',
      maxHeight: '121px',
      minHeight: '87px',
      width: '100%',
      padding: '20px 0',
      alignItems: 'center',
    },

    GameSkeleton__iconContainer: {
      width: 81,
      display: 'flex',
      position: 'relative',
      marginRight: 20,

      '&:before': {
        content: '" "',
        paddingBottom: '100%',
      },

      [uiTheme.breakpoints.up('md')]: {
        width: 81,
        flex: '1 0 81px',
      },
      flex: '1 auto',
    },

    GameSkeleton__textContainer: {
      flex: '1 100%',
      padding: 0,
    },

    GameSkeleton__text: {
      height: '32px',
      width: '50%',

      '&:last-of-type': {
        width: '25%',
      },
    },

    GameSkeleton__icon: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      aspectRatio: '1 / 1',
      // I don't know why MUI is transforming this...
      transform: 'none !important',
      borderRadius: '10px !important',
    },
  }),
)
