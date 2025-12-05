import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameTagsTemplateStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '10px',
      width: '100%',
    },

    form: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '0px 10px 10px 10px',
      '& > *': {
        margin: '8px 0',
      },
    },

    formLayout: {
      display: 'flex',
      flexDirection: 'column',
      width: '30%',
    },

    formSections: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '32%',
    },

    title: {
      marginTop: '10px',
      marginLeft: '10px',
      textAlign: 'center',
    },

    formContainer: {
      padding: '10px',
      margin: 'auto',
      width: '75%',
    },

    dateContainer: {
      margin: '10px 0px',
      width: '215px',
    },

    formControl: {
      width: '120px',
    },

    formSeg: {
      display: 'flex',
      flexDirection: 'column',
      marginTop: '15px',
    },

    actionButtons: {
      margin: '6px',
    },

    formButtons: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '10px',

      '& button': {
        marginRight: 6,
      },
    },

    formButtons_loading: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '10px',
    },
  }),
)
