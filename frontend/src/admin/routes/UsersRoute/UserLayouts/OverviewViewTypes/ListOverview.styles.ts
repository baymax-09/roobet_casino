import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useListOverviewStyles = makeStyles(theme =>
  createStyles({
    infoWrapper: {
      padding: 0,
    },

    userFieldName: {
      marginRight: theme.spacing(2),
      width: 140,
    },

    userFieldValue: {
      fontWeight: theme.typography.fontWeightMedium,
    },

    buttonFieldValue: {
      // give a min width so the buttons are aligned
      // 60px is roughly the width of "$1000.00"
      minWidth: '60px',
    },

    listItemButtonContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
    },

    listItemButtons: {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: 12,
    },

    balanceModifier: {
      fontWeight: 'bold',
      marginRight: theme.spacing(2),
      '&:hover': {
        opacity: 0.8,
        cursor: 'pointer',
        textDecoration: 'underline',
      },
    },

    listItemButtonContainerText: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginRight: 36,
      width: 230,
    },

    togglesContainer: {
      margin: '16px 0',
    },

    cancelLink: {
      color: theme.palette.primary.main,
      cursor: 'pointer',
      display: 'inline-block',
      fontWeight: 'bold',
      marginLeft: theme.spacing(2),
    },
  }),
)
