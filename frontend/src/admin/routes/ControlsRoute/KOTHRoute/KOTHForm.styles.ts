import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKOTHFormStyles = makeStyles(theme =>
  createStyles({
    KOTHFormContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '15px',
      width: 'min-content',
    },
    Form_addMarginTop: {
      marginTop: '10px',
    },
    KOTHFormContainer__form: {
      minWidth: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',

      '& > *': {
        margin: '8px 0',
      },
    },
    Form__actions: {
      display: 'flex',
      flexDirection: 'row',
    },
  }),
)
