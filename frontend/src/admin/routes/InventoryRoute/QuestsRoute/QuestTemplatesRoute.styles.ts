import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useQuestTemplatesRouteStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '10px',
      width: '100%',
      gap: '20px',
    },

    questsContainer: {
      display: 'flex',
      flexDirection: 'column',
    },

    formContainer: {
      padding: '10px',
      width: '600px',
    },

    form: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0px 10px 10px 10px',
      '& > *': {
        margin: '8px 0',
      },
    },

    header: {
      display: 'flex',
      flexDirection: 'row',
      gap: '10px',
      width: '100%',
    },

    rightHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      width: '300px',
    },

    title: {
      marginTop: '10px',
      marginLeft: '10px',
    },

    formButtons: {
      display: 'flex',
      '& button': {
        marginRight: 6,
      },
    },
  }),
)
