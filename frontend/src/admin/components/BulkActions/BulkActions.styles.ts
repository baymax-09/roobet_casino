import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBulkActionsStyles = makeStyles(theme =>
  createStyles({
    root: {
      position: 'initial',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },

    paper: {
      display: 'flex',
      alignItems: 'center',
      borderRadius: 0,
      padding: theme.spacing(2),
      flexShrink: 0,
    },

    actions: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,

      '& button:not(:last-child)': {
        marginRight: theme.spacing(1),
      },
    },

    table: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
    },
    invalid_column_text: {
      color: 'red',
      margin: 10,
    },
    cell_error_background: {
      backgroundColor: 'red',
    },
  }),
)
