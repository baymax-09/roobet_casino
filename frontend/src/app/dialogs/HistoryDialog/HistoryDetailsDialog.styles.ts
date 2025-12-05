import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useHistoryDetailDialogStyles = makeStyles(theme =>
  createStyles({
    HistoryDetailDialog: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      padding: uiTheme.spacing(2),
      margin: uiTheme.spacing(2),
      background: uiTheme.palette.neutral[800],
      borderRadius: 12,

      [uiTheme.breakpoints.up('md')]: {
        width: '100%',
        margin: 0,
        background: 'initial',
        borderRadius: 'initial',
        padding: `${theme.spacing(3)} ${theme.spacing(3.5)} ${theme.spacing(
          3.5,
        )} ${theme.spacing(3.5)}`,
      },
    },

    HistoryDetailDialog__id: {
      overflowWrap: 'break-word',
    },

    HistoryDetailDialog__key: {
      fontWeight: uiTheme.typography.fontWeightBold,
    },

    HistoryDetailDialog__value: {
      color: uiTheme.palette.neutral[400],
    },
  }),
)
