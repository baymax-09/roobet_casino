import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
export const useFormTemplateStyles = makeStyles(theme =>
  createStyles({
    Form__field: {
      display: 'flex',
      alignItems: 'flex-end',
    },
    Form__container: {
      margin: '0 auto',
      padding: theme.spacing(4),
      '& .MuiInputBase-root': {
        marginBottom: theme.spacing(5),
      },
      '& .MuiDivider-root': {
        marginBottom: '40px',
      },
    },
    Form__table: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    Table__column: {
      display: 'flex',
      flexDirection: 'column',
      width: '32%',
    },
    Table__policy_column: {
      display: 'flex',
      flexDirection: 'column',
      width: '65%',
    },
    Form__fieldContainer: {
      padding: theme.spacing(2),
      margin: `${theme.spacing(1)} 0`,
      '& .MuiInputBase-root': {
        marginBottom: 0,
        marginRight: theme.spacing(1),
      },
    },
    Form__action: {
      marginLeft: 10,
    },
  }),
)
