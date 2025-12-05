import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useHistoryTableStyles = makeStyles(theme =>
  createStyles({
    HistoryTableContainer: {
      padding: theme.spacing(2),
    },

    HistoryTableBody__cell: {
      boxSizing: 'content-box',
      background: uiTheme.palette.neutral[800],
      color: uiTheme.palette.common.white,
      borderBottom: 'none',

      fontWeight: theme.typography.fontWeightMedium,
      fontSize: '0.75rem',
      lineHeight: '1rem',
      padding: `0px 0px ${theme.spacing(1)} 0px`,
      height: 32,
    },

    HistoryTableBody__cell_positive: {
      color: uiTheme.palette.success[500],
    },

    HistoryTableBody__cell_negative: {
      color: uiTheme.palette.common.white,
    },

    HistoryTableBody__cell_neutral: {
      color: uiTheme.palette.common.white,
    },

    HistoryTableBody__firstCellRow: {
      paddingTop: theme.spacing(1.5),
    },

    HistoryTableBody__lastCellRow: {
      paddingBottom: theme.spacing(1.5),
    },

    HistoryTableBody__firstCellColumn: {
      paddingLeft: 32,
    },

    HistoryTableBody__lastCellColumn: {
      paddingRight: 32,
      textAlign: 'center',
    },

    HistoryTableBody_ellipsis: {
      overflow: 'hidden',
      maxWidth: 120,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    HistoryTableBody__currency: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    },

    HistoryTableBody__currencyIcon: {
      height: 16,
      width: 16,
    },

    HistoryTableBody__details: {
      textAlign: 'center',
    },

    HistoryTableBody__detailsIcon: {
      '&:hover .Ui-fill': {
        fill: uiTheme.palette.common.white,
      },
    },
  }),
)
