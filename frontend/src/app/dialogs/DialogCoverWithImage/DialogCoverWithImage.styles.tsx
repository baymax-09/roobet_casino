import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDialogCoverWithImageStyles = makeStyles(() =>
  createStyles({
    DialogCoverWithImage: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row-reverse',
      },
    },

    DialogCoverWithImage__backgroundWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      pointerEvents: 'none',
      objectFit: 'cover',
      borderRadius: 12,
      width: '100%',
      height: '100%',

      [uiTheme.breakpoints.up('md')]: {
        backgroundSize: 'cover',
        borderRadius: 0,
      },
    },

    DialogCoverWithImage__rightImage: {
      position: 'relative',
      height: 240,
      zIndex: 1,
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: 352,
        height: 246,
        marginLeft: 'auto',
      },
    },

    DialogCoverWithImage__writtenContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      zIndex: 1,
    },
  }),
)
