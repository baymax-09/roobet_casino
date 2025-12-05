import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useRaffleFormStyles = makeStyles(theme =>
  createStyles({
    formContainer: {
      marginTop: theme.spacing(5),
      padding: theme.spacing(3),
    },

    gridItem: {
      width: '100%',
      paddingBottom: '0 important!',

      '& > div': {
        marginTop: 0,
      },
    },

    winners: {
      flex: 'none',
      // Hide MUI toolbar & footer.
      '& .MuiToolbar-root[role="toolbar"], & .MuiTablePagination-root': {
        display: 'none !important',
      },
    },

    fileSelect: {
      display: 'flex',
      flexDirection: 'column',

      '& > label': {
        color: theme.palette.text.secondary,
        fontSize: theme.typography.caption.fontSize,
        marginBottom: theme.spacing(1),
      },

      ' & span': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },

    modifier: {
      position: 'relative',
      width: '100%',
      padding: theme.spacing(3),

      '& > button': {
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
        zIndex: 1,
      },

      '&:not(:last-of-type)': {
        marginBottom: theme.spacing(3),
      },
    },

    modifierContainer: {
      marginTop: theme.spacing(3),
    },
  }),
)
