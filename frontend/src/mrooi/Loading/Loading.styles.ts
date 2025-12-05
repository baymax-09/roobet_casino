import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLoadingStyles = makeStyles(() =>
  createStyles({
    Loading: {
      text: {
        visibility: 'hidden',
      },
    },

    spinner: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',

      '& svg': {
        animation: '$spin 1s infinite linear',
      },
    },

    '@keyframes spin': {
      '0%': {
        transform: 'rotate(0deg)',
      },
      '100%': {
        transform: 'rotate(360deg)',
      },
    },
  }),
)
