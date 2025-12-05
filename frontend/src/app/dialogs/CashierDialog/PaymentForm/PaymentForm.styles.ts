import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const usePaymentFormStyles = makeStyles(() =>
  createStyles({
    kycRequired: {
      fontSize: 14,
      '& button': {
        marginTop: 10,
      },
    },
  }),
)
