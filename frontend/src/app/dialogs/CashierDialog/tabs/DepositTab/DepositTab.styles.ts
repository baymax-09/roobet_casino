import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDepositTabStyles = makeStyles(theme =>
  createStyles({
    ChipContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: uiTheme.spacing(1),
    },

    BottomButtons: {
      display: 'flex',
      gap: uiTheme.spacing(1),
      flexDirection: 'column',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    ContentContainer_cashBackground: {
      backgroundColor: uiTheme.palette.common.white,
    },

    kycAlert: {
      margin: `-${theme.spacing(1)} -${theme.spacing(2)} ${theme.spacing(2)}`,
      borderRadius: '0',
    },

    QRContainer: {
      height: 'fit-content',
      padding: theme.spacing(0.25),
      backgroundColor: uiTheme.palette.common.white,
      borderRadius: 5,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    QR: {
      flexShrink: 0,
      width: '4rem !important',
      height: '4rem !important',
    },

    FieldsContainer: {
      width: '100%',
      gap: uiTheme.spacing(0.5),

      [uiTheme.breakpoints.up('md')]: {
        flex: 1,
        width: 'auto',
      },
    },

    rootOption: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },

    mainContentContainer: {
      display: 'flex',
      gap: uiTheme.spacing(1.5),
    },

    Link: {
      '&:hover': {
        color: uiTheme.palette.common.white,
      },
    },

    depositInputColumn: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },

    accountDetailsRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: uiTheme.spacing(2),
    },

    depositInputRow: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      alignItems: 'end',
    },

    quickDepositButtons: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      // @ts-expect-error fix me
      color: theme.palette.text.secondaryInverse,
      '& button': {
        width: '30px',
      },
    },

    customInputRow: {
      display: 'flex',
      flexDirection: 'row',
      marginLeft: theme.spacing(2),
      alignItems: 'end',
    },

    RippleWarningTextContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'start',
      gap: theme.spacing(0.5),
    },

    RippleListItem: {
      marginLeft: theme.spacing(0.5),
      padding: 0,
    },

    RippleListItem__text: {
      '&.MuiListItemText-root': {
        margin: 0,
      },
    },
  }),
)
