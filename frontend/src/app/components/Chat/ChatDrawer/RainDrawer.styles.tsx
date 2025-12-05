import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRainDrawerStyles = makeStyles(theme =>
  createStyles({
    RainDrawer: {
      display: 'flex',
      flexDirection: 'column',
    },

    InputContainer: {
      display: 'flex',
      padding: 16,
      flexDirection: 'column',
      gap: 12,
      borderRadius: 12,
      background: uiTheme.palette.neutral[800],
      margin: 16,
    },

    InputContainer__amount: {
      background: `${uiTheme.palette.neutral[700]} !important`,

      '& input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button':
        {
          WebkitAppearance: 'none',
          MozAppearance: 'none',
        },
    },

    Dropdown: {
      background: `${uiTheme.palette.neutral[700]} !important`,
    },

    MenuItem: {
      '&.Mui-selected': {
        fontWeight: `${uiTheme.typography.fontWeightBold} !important`,
      },
    },

    MenuItem__nameContainer: {
      display: 'flex',
    },

    MenuItem__name: {
      // TODO: Remove once using Excon
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 500,
    },

    MenuItem__selectedItem: {
      fontWeight: 700,
    },

    MenuItem__balance: {
      position: 'absolute',
      right: 0,
      marginRight: 39,
      color: uiTheme.palette.success[500],
      // TODO: Remove once using Excon
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 500,
    },

    Dropdown__balanceImg: {
      width: '1.25rem',
      height: '1.25rem',
    },

    Dropdown__valueContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'start',
    },

    Dropdown__cryptoName: {
      marginLeft: 8,
      marginRight: 4,
      fontWeight: 700,
    },

    Dropdown__shortCode: {
      fontSize: '0.75rem',
      fontWeight: 500,
      color: '#7B6CB9',
    },

    Dropdown__balance: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      color: uiTheme.palette.success[500],
      fontWeight: 500,
      marginLeft: 'auto',
    },

    RainDrawer__buttonContainer: {
      display: 'flex',
      padding: theme.spacing(2),
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      alignSelf: 'stretch',
      background: uiTheme.palette.neutral[900],
    },
  }),
)
