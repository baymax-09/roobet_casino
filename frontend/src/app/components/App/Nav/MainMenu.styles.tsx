import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useMainMenuStyles = makeStyles(theme =>
  createStyles({
    MainMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
    },

    TotalBetsWagered: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: uiTheme.palette.neutral[900],
      borderRadius: '12px',
      padding: `${uiTheme.spacing(1.25)} ${uiTheme.spacing(
        1.5,
      )} ${uiTheme.spacing(1)} ${uiTheme.spacing(1.5)} !important`,
      gap: uiTheme.spacing(0.25),
    },
  }),
)
