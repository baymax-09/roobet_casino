import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useNotificationIconStyles = makeStyles(theme =>
  createStyles({
    icon: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundSize: 'contain',

      '& .MuiSvgIcon-root': {
        height: '0.9em',
      },
    },
  }),
)
