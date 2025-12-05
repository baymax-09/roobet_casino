import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAccountSettingsRouteStyles = makeStyles(() =>
  createStyles({
    AccountSettingsRoute: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      padding: uiTheme.spacing(2),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    AccountSettingsRouteContainer: {
      height: 'fit-content',
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',

      [uiTheme.breakpoints.up('md')]: {
        height: '904px',
      },
    },

    AccountSettings: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
    },

    AccountSettingsContent: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: uiTheme.palette.neutral[800],
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(1.5),
      overflow: 'hidden',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(2),
      },
    },

    AccountSettingsContent_noSideNavigation: {
      borderRadius: '12px',
    },
  }),
)
