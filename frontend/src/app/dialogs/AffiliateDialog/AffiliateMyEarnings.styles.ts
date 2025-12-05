import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAffiliateMyEarningsStyles = makeStyles(() =>
  createStyles({
    AffiliateMyEarnings: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(1.5),
      },
    },

    AffiliateMyEarnings_removePadding: {
      [uiTheme.breakpoints.up('md')]: {
        padding: 0,
      },
    },

    AffiliateReferralHistory: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
  }),
)
