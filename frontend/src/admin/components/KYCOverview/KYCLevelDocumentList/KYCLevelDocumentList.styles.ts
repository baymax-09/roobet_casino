import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCLevelDocumentListStyles = makeStyles(theme =>
  createStyles({
    levelStatus: {
      textTransform: 'capitalize',
      marginLeft: 'auto',
    },

    documentsList: {
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflowY: 'auto',

      // Hide scrollbar.
      '&::-webkit-scrollbar': {
        width: 0,
        height: 0,
      },
    },

    document: {
      display: 'flex',

      '&:not(:last-of-type)': {
        marginBottom: theme.spacing(3),
      },
    },

    documentPreview: {
      width: 200,
      height: 200,
      marginRight: theme.spacing(2),
      display: 'flex',
      backgroundColor: 'rgba(0,0,0,.1)',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.palette.text.primary,
      textDecoration: 'none',
    },

    documentImage: {
      width: '100%',
      height: '100%',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
    },

    documentDetail: {
      flexGrow: 1,

      '& > *': {
        marginBottom: theme.spacing(0.5),
      },

      '& .MuiButton-root': {
        margin: `0 ${theme.spacing(1)} ${theme.spacing(1)} 0`,

        '&:hover': {
          textDecoration: 'none',
        },
      },
    },

    documentStatusSelector: {
      marginRight: theme.spacing(1),
    },

    manualVerificationToggle: {
      marginRight: 'auto',
    },
  }),
)
