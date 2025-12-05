import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useFreeSpinsTypeSettingsStyles = makeStyles(theme =>
  createStyles({
    FreeSpinsTypeSettings: {
      margin: theme.spacing(0.5),
      padding: theme.spacing(1),
      border: '1px solid #C4C4C4',
      borderRadius: 4,
    },

    FreeSpinsTypeSettings__tpGameAggregatorContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      whiteSpace: 'nowrap',
      marginBottom: theme.spacing(1),
    },

    FreeSpinsTypeSettings__amountContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(1),
    },

    FreeSpinsTypeSettings__formControlSpinAmount: {
      whiteSpace: 'nowrap',
      minWidth: 60,
    },
  }),
)
