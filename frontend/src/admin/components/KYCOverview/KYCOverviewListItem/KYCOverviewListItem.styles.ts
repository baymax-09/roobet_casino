import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCOverviewListItemStyles = makeStyles(theme =>
  createStyles({
    KYCLevel1DetailsContainer__userFieldName: {
      marginRight: theme.spacing(2),
      width: 120,
    },

    KYCLevel1DetailsContainer__userFieldValue: {
      fontWeight: theme.typography.fontWeightMedium,
    },

    KYCLevel1DetailsContainer__failureField: {
      marginLeft: theme.spacing(1),
      color: theme.palette.error.main,
    },
  }),
)
