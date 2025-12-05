import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRulesDrawerStyles = makeStyles(theme =>
  createStyles({
    RulesDrawer: {
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2),
    },

    RulesDrawer__rulesContainer: {
      listStyle: 'initial',
      marginLeft: theme.spacing(2),
    },

    RulesDrawer__rule: {
      color: uiTheme.palette.neutral[200],
      fontSize: '0.75rem',
      fontWeight: uiTheme.typography.fontWeightMedium,
      lineHeight: '1.065rem',
    },

    RulesDrawer__buttonContainer: {
      display: 'flex',
      padding: theme.spacing(2),
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      alignSelf: 'stretch',
      background: uiTheme.palette.neutral[900],
    },
  }),
)
