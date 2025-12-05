import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useCurrencySelectorStyles = makeStyles(() =>
  createStyles({
    CurrencyOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 11, // the games seem to be at an zIndex of 10

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: uiTheme.spacing(1.25),
      backgroundColor: 'rgba(9, 12, 29, 0.95)',
      borderRadius: '6px 6px 0px 0px',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    CurrencyOverlay__message: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 220,
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        height: 'initial',
        width: 'initial',
      },
    },

    Message__title: {
      fontWeight: uiTheme.typography.fontWeightBold,
      lineHeight: '1.25rem',
    },

    Message__subTitle: {
      fontWeight: uiTheme.typography.fontWeightMedium,
      lineHeight: '1.25rem',
      color: `${uiTheme.palette.neutral[300]}`,
    },

    CurrencyOverlay__actions: {
      display: 'flex',
      flexDirection: 'column',
      width: 208,
      alignItems: 'center',
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
      },
    },

    Actions__dropdownContainer: {
      display: 'flex',
      alignItems: 'center',
      width: 192,
      justifyContent: 'space-around',
    },

    ButtonContainer: {
      display: 'flex',
      flexDirection: 'row',
      width: 220,
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        width: 'inherit',
      },
    },

    Dropdown__valueContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },

    Dropdown__itemsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    Dropdown__label: {
      lineHeight: '1.25rem',
      // Ignoring type as it conflicts with react csstype, to remove when upgrading React and MUI.
      fontWeight: uiTheme.typography.fontWeightBold as any,
      paddingLeft: uiTheme.spacing(1),
    },
  }),
)
