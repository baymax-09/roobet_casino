import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDialogStyles = makeStyles(() =>
  createStyles({
    root: {},

    loginOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${uiTheme.palette.neutral[900]}BF`,
    },
  }),
)
