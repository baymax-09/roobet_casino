import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameTagsRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '10px',
      width: '100%',
    },

    form: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      width: '350px',
      padding: '0px 10px 10px 10px',
      '& > *': {
        margin: '8px 0',
      },
    },
    formColumn: {
      display: 'flex',
      padding: '10px',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    table: {
      margin: '0px 20px',
    },

    title: {
      marginTop: '10px',
      marginLeft: '10px',
      textAlign: 'center',
    },

    formContainer: {
      padding: '10px',
    },

    dateContainer: {
      margin: '10px 0px',
    },

    formControl: {
      minWidth: 120,
    },

    selectEmpty: {
      marginTop: theme.spacing(2),
    },
    actionButtons: {
      margin: '6px',
    },

    formButtons: {
      display: 'flex',

      '& button': {
        marginRight: 6,
      },
    },

    tableTitle: {
      marginLeft: '10px',
    },

    tableContainer: {
      width: '100%',
      paddingTop: '5px',
    },

    innerTableContainer: {
      padding: '10px',
    },

    tableHeader: {
      display: 'flex',
      gap: '30px',
    },

    tableBody: {
      '& > tr > td': {
        padding: 5,
      },
    },

    titleTableCell: {
      maxWidth: '150px',
      width: '150px',
      borderTop: `1px solid ${theme.palette.gray.light}`,
    },

    headerTableCell: {
      borderTop: `1px solid ${theme.palette.gray.light}`,
    },

    bodyTableCell: {
      padding: '16px !important',
    },
  }),
)
