import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMessageFormStyles = makeStyles(theme =>
  createStyles({
    imageUpload: {
      width: '100%',
      marginBottom: theme.spacing(6),
    },

    imageUploadPreview: {
      paddingBottom: '36%',

      '& > *': {
        position: 'absolute',
        left: '0',
        right: '0',
        top: '0',
        bottom: '0',
      },
    },

    recipientsField: {
      display: 'flex',
      alignItems: 'flex-end',
    },

    recipientsContainer: {
      padding: theme.spacing(2),
      margin: `${theme.spacing(1)} 0`,

      '& .MuiInputBase-root': {
        marginBottom: 0,
        marginRight: theme.spacing(1),
      },
    },

    bulkUserButton: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
    },
  }),
)
