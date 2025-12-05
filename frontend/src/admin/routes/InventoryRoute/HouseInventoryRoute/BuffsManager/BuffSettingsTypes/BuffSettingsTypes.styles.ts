import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBuffSettingsTypesStyles = makeStyles(() =>
  createStyles({
    buffsContainer: {
      alignItems: 'flex-start',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '10px',
    },

    freeBetContainer: {
      display: 'flex',
      gap: '10px',
      alignItems: 'end',
    },

    freeBetAmount: {
      width: 'auto',
    },

    betType: {
      width: 'auto',
    },
  }),
)
