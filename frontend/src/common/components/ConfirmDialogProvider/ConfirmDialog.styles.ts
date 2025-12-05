import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useConfirmDialogProviderStyles = makeStyles(() =>
  createStyles({
    message: {
      wordWrap: 'break-word',
    },

    form: {
      display: 'block',
      width: '100%',
    },

    formControl: {
      marginBottom: 8,
    },

    datePicker: {
      marginTop: '10px',
    },

    Checkbox__label: {
      marginLeft: 2,
    },
  }),
)
