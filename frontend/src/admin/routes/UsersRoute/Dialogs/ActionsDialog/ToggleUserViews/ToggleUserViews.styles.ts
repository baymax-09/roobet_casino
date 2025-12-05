import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useToggleUserViewsStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },

    groupLabel: {
      paddingBottom: theme.spacing(1),
      paddingTop: theme.spacing(1),
    },

    leftActions: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
    },

    lockAccount: {
      color: theme.palette.red.main,

      '& .MuiTypography-body1': {
        fontWeight: theme.typography.fontWeightMedium,
      },
    },

    deleteAccountButton: {
      color: theme.palette.red.main,
    },

    grid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
    },
  }),
)
