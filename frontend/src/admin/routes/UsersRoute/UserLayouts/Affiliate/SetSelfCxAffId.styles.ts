import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSetSelfCxAffIdStyles = makeStyles(theme =>
  createStyles({
    formGroup: {
      display: 'flex',
      alignItems: 'flex-end',

      '& .MuiInput-root': {
        width: '250px',
      },

      '& .MuiButton-root': {
        marginLeft: theme.spacing(1),
      },
    },
  }),
)
