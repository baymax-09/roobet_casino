import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useAffiliateReferralsStyles = makeStyles(theme =>
  createStyles({
    AffiliateReferrals: {
      display: 'flex',
      flexDirection: 'column',
    },

    BackToEarningsButtonContainer: {
      padding: `${theme.spacing(2)} ${theme.spacing(3.5)} ${theme.spacing(
        2,
      )} ${theme.spacing(3.5)}`,
    },

    BackToEarningsButton: {
      alignSelf: 'baseline',
    },

    TableContainer: {
      overflowX: 'auto',
      borderTop: '2px solid black',

      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  }),
)
