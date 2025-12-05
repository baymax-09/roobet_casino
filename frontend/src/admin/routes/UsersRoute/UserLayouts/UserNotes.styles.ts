import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useUserNotesStyles = makeStyles(theme =>
  createStyles({
    userNotesCard: {
      height: '100%',
      overflow: 'auto',
      minWidth: '300px',
    },

    userNote: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      '& > *': {
        padding: '8px !important',
      },
    },

    userNoteHeader: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    userNoteTextBox: {
      minHeight: '100px',
      display: 'flex',

      '& > form': {
        flex: 1,
        height: '100%',
        width: '100%',
      },
    },

    userNoteTextFieldContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'stretch',
      alignItems: 'stretch',
      flex: 1,
    },

    userNoteTextField: {
      background: 'transparent',
      flex: 1,
      padding: theme.spacing(1),
      border: 'none !important',

      '&:read-write:focus': {
        outline: 'none',
      },

      '&:empty:before': {
        content: 'attr(placeholder)',
        display: 'block',
      },
    },

    userNoteButtonContainer: {
      width: '100%',
      flex: 0,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingBottom: '8px',
      paddingRight: '8px',
    },

    userNoteActions: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',

      '& > *': {
        position: 'relative',
        bottom: '5px',
      },
    },

    userNoteInfo: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },

    noteSelect: {
      margin: 15,
      marginBottom: 0,
      width: 'calc(100% - 30px)',
    },
  }),
)
