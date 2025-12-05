import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useHouseInventoryRouteStyles = makeStyles(() =>
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

    inventoryAndUserContainer: {
      display: 'flex',
      flexDirection: 'column',
    },

    formContainer: {
      padding: '10px',
      width: '100%',
      maxWidth: '1000px',
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

    imageContainer: {
      width: '200px !important',
      maxWidth: '200px !important',
    },

    rightHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      width: '300px',
    },

    quantityContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: '20px',
    },

    infiniteQuantity: {
      '& .MuiFormControlLabel-label': {
        whiteSpace: 'nowrap',
      },
    },

    rarityContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '10px',
      marginTop: '15px',
    },

    freeBetsGamesContainer: {
      alignItems: 'center',
      gap: '10px',
      marginTop: '15px',
    },

    buffAndUsageSettings: {
      display: 'flex',
      flexDirection: 'row',
      gap: '10px',
      width: '100%',
    },

    usageSettings: {
      width: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '5px',
      minWidth: '210px',
    },

    limitedUsesContainer: {
      display: 'flex',
      flexDirection: 'row',
    },

    frequencyAndTypeContainer: {
      display: 'flex',
      gap: '5px',
    },

    frequencyContainer: {
      width: 'auto',
    },

    title: {
      marginTop: '10px',
      marginLeft: '10px',
    },

    transferToUser: {
      width: 'auto',
      height: 'auto',
      marginTop: '5px',
      padding: '10px',
    },

    transferUserContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      maxWidth: '310px',
    },

    userIdContainer: {
      marginTop: '-15px !important',
    },

    transferButton: {
      marginLeft: '30px',
    },

    loading: {
      display: 'contents !important',
    },

    buttonsContainer: {
      display: 'flex',
      '& > *': {
        marginRight: 8,
      },
    },
  }),
)
