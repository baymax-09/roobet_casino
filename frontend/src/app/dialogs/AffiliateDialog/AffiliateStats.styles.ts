import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAffiliateStatsStyles = makeStyles(() =>
  createStyles({
    AffiliateStats: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
      },
    },

    AffiliateStatsHeader: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',

      [uiTheme.breakpoints.up('md')]: {
        marginBottom: uiTheme.spacing(1.5),
      },
    },

    AffiliateStatsTopBlockWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
        flexDirection: 'row',
      },
    },

    AffiliateStatsTopBlockWrapper__item: {
      flexGrow: 1,

      [uiTheme.breakpoints.up('md')]: {
        width: '50%',
        flexGrow: 0,
      },
    },

    TooltipContainer: {
      marginLeft: 'auto',
    },

    ClaimEarningsButtonContainer: {
      width: '100%',
    },

    ClaimEarningsButton: {
      minWidth: '135px !important',
    },
  }),
)
