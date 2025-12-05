import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const usePreferencesTabStyles = makeStyles(theme =>
  createStyles({
    TogglesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',
      height: 'fit-content',
    },

    ToggleContainer: {
      display: 'flex',
      gap: uiTheme.spacing(1.5),
      width: '100%',
      height: 'fit-content',
    },

    ToggleContainer__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
      width: '100%',
      height: 'fit-content',
    },
  }),
)
