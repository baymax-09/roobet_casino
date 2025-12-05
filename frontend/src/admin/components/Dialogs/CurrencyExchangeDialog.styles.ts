import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useCurrencyExchangeDialogStyles = makeStyles(theme =>
  createStyles({
    CurrencyExchange: {
      backgroundColor: theme.palette.primary.darker,
      overflow: 'hidden',
      maxWidth: 486,
    },

    CurrencyExchange__paper: {
      display: 'flex',
      paddingTop: `${theme.spacing(2)} !important`,
      background: `#e9e9e9`,
      '& > div:not(:last-child)': {
        marginRight: theme.spacing(2),
      },
    },

    CurrencyExchange__textFieldBase: {
      '& > label': {
        color: theme.palette.common.black,
      },
      '& > div': {
        color: theme.palette.common.black,
      },
    },

    CurrencyExchange__currencySelector: {
      minWidth: 120,
    },

    CurrencyExchange__header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: theme.palette.common.black,
    },

    CurrencyExchange__heading: {
      color: 'inherit',
    },

    Header__textAlignment: {
      marginLeft: -theme.spacing(1.5),
      color: 'inherit',
    },

    Header__modeToggle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingLeft: 2,
    },

    ModeToggle__toggleGroup: {
      display: 'flex',
      alignItems: 'center',
    },

    ModeToggle__toggleGroupSwitch: {
      color: '#e9e9e9',
    },
  }),
)
