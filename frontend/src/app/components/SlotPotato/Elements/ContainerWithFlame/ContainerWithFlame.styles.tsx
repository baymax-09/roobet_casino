import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { BANNER_BORDER_RADIUS } from '../../constants'

export const useContainerWithFlameStyles = makeStyles(theme =>
  createStyles({
    ContainerWithFlame: {
      display: 'flex',
      maxWidth: 'fit-content',
      height: '100%',
    },

    ContentContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: theme.spacing(5.25),
      paddingRight: theme.spacing(5.25),
      backgroundColor: '#F8950D',
      borderRadius: `0px ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px 0px`,
      width: 'max-content',
    },

    ContentContainer_noPadding: {
      padding: 0,
    },

    LeftFlame: {
      position: 'absolute',
      left: '-62px',
      top: 0,
      bottom: 0,
    },

    ContentContainer_noBackground: {
      backgroundColor: 'inherit',
    },
  }),
)
