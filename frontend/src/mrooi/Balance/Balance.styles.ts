import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface StylesProps {
  dark: boolean
}

export const useBalanceStyles = makeStyles(theme =>
  createStyles({
    root: ({ dark }: StylesProps) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: dark ? 'rgb(205 187 255 / 10%)' : theme.palette.primary.main,
      margin: '0 auto',
      padding: uiTheme.spacing(0.625),
      borderRadius: uiTheme.spacing(2),
    }),

    '@keyframes pulse': {
      '0%, 100%': {
        boxShadow: `0 0 0 2px ${uiTheme.palette.secondary.main}00, 0 0 0 4px ${uiTheme.palette.secondary.main}00`,
      },
      '25%': {
        boxShadow: `0 0 0 2px ${uiTheme.palette.secondary.main}, 0 0 0 4px ${uiTheme.palette.secondary.main}00`,
      },
      '50%': {
        boxShadow: `0 0 0 2px ${uiTheme.palette.secondary.main}, 0 0 0 4px ${uiTheme.palette.secondary.main}3D`,
      },
      '75%': {
        boxShadow: `0 0 0 2px ${uiTheme.palette.secondary.main}00, 0 0 0 4px ${uiTheme.palette.secondary.main}3D`,
      },
    },

    balanceAlert: {
      '&:before': {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        content: '""',
        borderRadius: uiTheme.spacing(2),
        zIndex: -1,
      },
      position: 'relative',
      animation: '$pulse 3s infinite',
    },

    balance: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: theme.spacing(0.5),
      paddingRight: theme.spacing(0.5),
      height: '100%',
      cursor: 'pointer',
    },

    image: {
      height: 18,
      width: 18,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      filter: 'drop-shadow(0px 2px 0px rgba(0, 0, 0, 0.15))',
      marginRight: 6,
    },

    bigImage: {
      width: 36,
      height: 36,
    },

    amount: {
      color: '#fff',

      fontWeight: theme.typography.fontWeightBold,
      userSelect: 'none',
      fontVariant: 'tabular-nums',
    },

    balanceAmount: {
      fontWeight: theme.typography.fontWeightMedium,
      fontVariant: 'tabular-nums',
      marginLeft: 10,
    },

    depositButton: {
      padding: '6px 8px',
      minWidth: 32,
      height: 36,
      background: theme.palette.green.main,
      color: theme.palette.primary.darker,

      fontWeight: theme.typography.fontWeightMedium,
      borderRadius: '6px',

      '&:hover': {
        background: theme.palette.green.light,
      },

      [uiTheme.breakpoints.up('md')]: {
        padding: '6px 16px',
        minWidth: 'initial',
      },
    },

    expandIcon: {
      color: theme.palette.primary.light,
    },

    walletName: {
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'right',
    },

    walletAmount: {
      margin: 0,
    },

    inGameText: {
      display: 'initial',
      whiteSpace: 'nowrap',
    },

    balancePopover: {
      top: '12px !important',
      borderRadius: '8px',
      color: uiTheme.palette.common.white,
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(1)} ${uiTheme.spacing(
        1,
      )} ${uiTheme.spacing(1.5)}`,
      minWidth: 'max-content',
      maxWidth: 'max-content',

      '&:hover': {
        cursor: 'pointer',
      },

      [uiTheme.breakpoints.up('md')]: {
        top: '10px !important',
      },
    },

    popoverContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    },

    popoverText: {
      minWidth: 'max-content',
      maxWidth: 'max-content',
    },

    lowBalance: {
      backgroundColor: uiTheme.palette.secondary.main,
    },

    emptyBalance: {
      backgroundColor: uiTheme.palette.error.main,
    },

    idleBalance: {
      backgroundColor: uiTheme.palette.primary.main,
    },

    /** New styles to accomodate adding walletSelector menuItem
     *  DanielM: 27-july-2023 */

    BalanceSelector__walletSettings: {
      display: 'flex',
      justifyContent: 'center',
      paddingLeft: theme.spacing(1.5),
    },

    BalanceSelector__divider: {
      borderTop: '1px solid #545084',
    },

    // New UI redesign styles
    UIBalance: {
      display: 'flex',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(
        0.5,
      )} ${uiTheme.spacing(0.5)} ${uiTheme.spacing(1.25)}`,
      alignItems: 'center',
      gap: uiTheme.spacing(1.25),
      backgroundColor: uiTheme.palette.neutral[900],
      borderRadius: 16,
    },

    UIBalanceContent: {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      gap: uiTheme.spacing(1),
      cursor: 'pointer',

      '&:hover': {
        '& > #balance-action-icon': {
          backgroundColor: uiTheme.palette.neutral[700],
        },
      },
    },

    CryptoIcon: {
      width: 24,
      height: 24,
    },

    PopoverPaper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Need to overwrite Paper's default "top" to assure popover is low enough
      top: `calc(${uiTheme.shape.toolbarHeight.mobile}px + ${uiTheme.spacing(
        2,
      )}) !important`,

      [uiTheme.breakpoints.up('sm')]: {
        top: '64px !important',
      },
    },

    MenuItemContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      height: '100%',
      maxHeight: '80vh',
    },

    BalanceTypeContainer: {
      backgroundColor: uiTheme.palette.neutral[700],
      borderRadius: '12px',
      margin: `${uiTheme.spacing(2)} ${uiTheme.spacing(2)} ${uiTheme.spacing(
        0,
      )} ${uiTheme.spacing(2)}`,
      maxHeight: '80vh',
      overflow: 'auto',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      scrollbarWidth: 'none',
    },

    BalanceSelectorItem: {
      // Need to overwrite some of ListItemButton's base styles
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(1.5)} !important`,
      gap: uiTheme.spacing(1),

      '&:hover': {
        backgroundColor: `${uiTheme.palette.neutral[600]}7A !important`,

        '&  #crypto-title': {
          color: uiTheme.palette.common.white,
        },
      },

      '&.Mui-selected': {
        backgroundColor: `${uiTheme.palette.neutral[600]} !important`,
      },
    },

    BalanceSelectorItem__textItem: {
      // Overwriting ListItemText's base margins
      marginTop: '0px !important',
      marginBottom: '0px !important',
    },

    BalanceSelectorItem__textContainer: {
      display: 'flex',
      flexDirection: 'column',
    },

    BalanceSelectorItem__cryptoText: {
      display: 'flex',
      alignItems: 'center',
      gap: uiTheme.spacing(0.5),
    },

    BalanceSelectorItem__icon: {
      width: '2rem',
      height: '2rem',
    },

    WalletSettings: {
      padding: `${uiTheme.spacing(1.25)} ${uiTheme.spacing(0)}`,
      background: uiTheme.palette.neutral[700],
      cursor: 'pointer',

      '&:hover': {
        background: uiTheme.palette.neutral[600],
      },

      '&:hover .Ui-bottomHalf': {
        fill: uiTheme.palette.neutral[200],
      },

      '&:hover .Ui-topHalf': {
        fill: uiTheme.palette.neutral[200],
        stopColor: uiTheme.palette.neutral[200],
      },
    },

    WalletSettings__content: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: uiTheme.spacing(0.625),
      paddingBottom: uiTheme.spacing(0.875),
      gap: uiTheme.spacing(0.5),
    },
  }),
)
