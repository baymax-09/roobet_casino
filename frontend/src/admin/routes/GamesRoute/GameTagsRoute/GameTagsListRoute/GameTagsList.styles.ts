import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameTagsListStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: '100%',
    },

    table: {
      margin: 'auto',
      width: '100%',
    },

    title: {
      marginTop: '10px',
      marginLeft: '10px',
      textAlign: 'center',
    },

    formContainer: {
      padding: '10px',
    },

    actionButtons: {
      margin: '6px',
      justifyContent: 'center',
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
    },

    bodyTableCell: {
      padding: '16px !important',
    },

    createTagContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      margin: theme.spacing(1),
    },
  }),
)
