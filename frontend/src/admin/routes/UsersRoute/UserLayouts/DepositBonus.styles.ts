import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDepositBonusStyles = makeStyles(theme =>
  createStyles({
    root: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },

    form: {
      width: '100%',
    },

    danger: {
      color: theme.palette.red.main,
    },

    status: {
      margin: theme.spacing(1),
    },

    Formik__items: {
      marginTop: 15,
    },

    actions: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
  }),
)
