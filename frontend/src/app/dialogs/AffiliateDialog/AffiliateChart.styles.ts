import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAffiliateChartStyles = makeStyles(theme =>
  createStyles({
    AffiliateChart: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      flex: 1,
      height: '100%',
      borderRadius: theme.shape.borderRadius,
      overflow: 'hidden',
      width: '100%',
      padding: theme.spacing(1.5),
      gap: theme.spacing(1.5),
    },

    AffiliateChartHeader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    },

    Loader: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    AffiliateBlock__chart: {
      padding: '0px !important',
    },

    AffiliateChartTitleContainer: {
      display: 'flex',
      flexDirection: 'column',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    DaysContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
    },

    ChartButtons: {
      borderRadius: '12px !important',

      '&:active': {
        backgroundColor: `${uiTheme.palette.primary[500]} !important`,
      },
    },

    DaysButton: {
      padding: `${theme.spacing(0.75)} ${theme.spacing(1.75)} ${theme.spacing(
        0.75,
      )} ${theme.spacing(1.75)} !important`,
      minWidth: 'fit-content !important',
    },

    DaysButton_text: {
      fontWeight: `${uiTheme.typography.fontWeightBlack} !important`,
    },

    DaysButton_selected: {
      backgroundColor: `${uiTheme.palette.primary[500]} !important`,
    },
  }),
)
