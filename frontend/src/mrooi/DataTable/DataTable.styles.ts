import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDataTableStyles = makeStyles(() =>
  createStyles({
    root: {
      overflow: 'auto',
      display: 'flex',
      flex: 1,
      height: 'auto',
      minHeight: '400px',
      position: 'relative',
      marginBottom: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        marginBottom: 0,
        position: 'initial',
      },
    },

    table: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      position: 'relative',
    },

    expandedRow: {
      background: '#f5f5f5',
    },

    applyFilters: {
      marginTop: 40,
    },
  }),
)
