import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useFreeSpinsBuffSettingsStyles = makeStyles(theme =>
  createStyles({
    allFreeSpinsGroupsContainer: {
      display: 'grid',
      justifyContent: 'space-evenly',
      gridTemplateColumns: '1fr 1fr',
      marginTop: theme.spacing(1),
    },

    freeSpinContainer: {
      margin: theme.spacing(0.5),
      padding: theme.spacing(1),
      border: '1px solid #C4C4C4',
      borderRadius: '4px',
    },

    topRowContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      whiteSpace: 'nowrap',
      marginBottom: theme.spacing(1),
    },

    formControlSpinAmount: {
      whiteSpace: 'nowrap',
      minWidth: '60px',
    },

    spinValues: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  }),
)
