import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameThumbnailSkeletonStyles = makeStyles(() =>
  createStyles({
    GameThumbnail: {
      display: 'flex',
      flexDirection: 'column',
    },

    GameThumbnail__image: {
      height: 127,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        height: 147,
      },
    },

    TextContainer: {
      marginTop: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    TextContainer__title: {
      width: '75%',
    },

    TextContainer__provider: {
      width: '50%',
    },
  }),
)
