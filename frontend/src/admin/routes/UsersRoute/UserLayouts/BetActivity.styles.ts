import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useBetActivityStyles = makeStyles(theme =>
  createStyles({
    Table__Root: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      height: '100%',
      width: '100%',
    },
    Table__header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      borderBottom: `solid 1px ${theme.palette.gray.light}`,
      width: '100%',
      paddingBottom: '16px',
    },
    button_Report: {
      marginLeft: theme.spacing(1),
    },
    Table__Redirect: {
      textDecoration: 'none',
    },
    Redirect__Title: {
      fontWeight: uiTheme.typography.fontWeightBold,
    },
  }),
)
