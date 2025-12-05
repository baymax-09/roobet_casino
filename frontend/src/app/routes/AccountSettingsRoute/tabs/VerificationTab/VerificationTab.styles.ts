import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useVerificationTabStyles = makeStyles(() =>
  createStyles({
    VerificationTab: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      width: '100%',
      minHeight: '620px',
    },

    VerificationTab_panelSummaryBackground: {
      background: '#FAFAFA',
    },

    VerificationTab__panelSummary: {
      display: 'flex',
      justifyContent: 'space-between',
      maxWidth: '100%',
      width: '100%',
    },

    StatusIndicator: {
      display: 'flex',
      gap: uiTheme.spacing(1.5),
      padding: `${uiTheme.spacing(1.25)} ${uiTheme.spacing(
        1.75,
      )} ${uiTheme.spacing(1.25)} ${uiTheme.spacing(1.25)}`,
      minWidth: '212px',
      backgroundColor: uiTheme.palette.neutral[700],
      alignItems: 'center',
      justifyContent: 'flex-start',
      borderRadius: '12px',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'background-color 0.25s ease',
      '--icon-fill-color': uiTheme.palette.neutral[700],
      '--text-color': uiTheme.palette.neutral[400],

      '&:hover': {
        backgroundColor: uiTheme.palette.neutral[600],
        '--icon-fill-color': uiTheme.palette.neutral[600],
        '--text-color': uiTheme.palette.common.white,
      },
    },

    StatusIndicatorSlide: {
      '&:not(:last-child)': {
        marginRight: '8px',
      },
      width: 'fit-content',
    },

    Icon: {
      '& .Ui-fill': {
        fill: 'var(--icon-fill-color) !important',
      },
    },

    StatusIndicator__iconContainer: {
      display: 'flex',
      padding: uiTheme.spacing(1),
      borderRadius: '8px',
    },

    Skeleton: {
      borderRadius: '12px',
    },
  }),
)
