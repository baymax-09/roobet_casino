import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCLevel1DetailStyles = makeStyles(theme =>
  createStyles({
    KYCLevel1DetailsContainer__header: {
      display: 'flex',
    },

    KYCLevel1DetailsContainer__status: {
      marginLeft: 'auto',
      paddingRight: '10px',
      textTransform: 'capitalize',
    },

    KYCLevel1DetailsContainer__list: {
      display: 'flex',
    },

    KYCLevel1DetailsContainer__manualVerificationToggle: {
      marginTop: 'auto',
      marginLeft: 'auto',
    },

    KYCLevel1DetailsContainer__toggles: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  }),
)
