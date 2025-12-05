import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useNavigationMenuStyles = makeStyles(theme =>
  createStyles({
    NavigationMenuPopover: {
      backgroundColor: 'transparent',
      // Need to overwrite Paper's default "top" to assure popover is low enough
      top: `calc(${uiTheme.shape.toolbarHeight.mobile}px + ${uiTheme.spacing(
        2,
      )}) !important`,
      // So annoying but it's not lined up right with the icon button cause of the button outline, so we need this.
      transform: 'translate(4px, 0) !important',

      [uiTheme.breakpoints.up('sm')]: {
        top: '64px !important',
      },
    },

    NavigationMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      padding: uiTheme.spacing(2),
      borderRadius: 12,
      width: '11.875rem',
    },

    Username: {
      color: uiTheme.palette.common.white,
    },

    NotificationIndicatorContainer: {
      marginLeft: 'auto',
    },
  }),
)
