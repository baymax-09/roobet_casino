import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRedeemStyles = makeStyles(theme =>
  createStyles({
    RedeemDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '754px',
        },
      },
    },

    Redeem: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      margin: theme.spacing(2),
      borderRadius: 12,
      // TODO: Remove this cast when types are fixed in UI
      backgroundColor: (uiTheme.palette as any).neutral[800],

      [uiTheme.breakpoints.up('md')]: {
        borderRadius: 0,
        backgroundColor: 'initial',
        flexDirection: 'row-reverse',
        margin: 0,
      },
    },

    Redeem__slotMachine: {
      width: '85vw',
      zIndex: 1,
      display: 'flex',
      alignSelf: 'center',

      [uiTheme.breakpoints.between('sm', 'lg')]: {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        width: 352,
        height: 246,
        paddingRight: uiTheme.spacing(3.5),
        padding: `${theme.spacing(1.5)} ${theme.spacing(6.25)} ${theme.spacing(
          3.5,
        )} ${theme.spacing(1.25)}`,
      },
    },

    Redeem__writtenContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      zIndex: 1,
      padding: `0px ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(
        2,
      )}`,

      [uiTheme.breakpoints.between('sm', 'lg')]: {
        margin: 'auto auto !important',
        width: '100% !important',
        padding: `${theme.spacing(4)} ${theme.spacing(3.5)} !important`,
      },

      [uiTheme.breakpoints.up('md')]: {
        maxWidth: '100% !important',
        marginLeft: 0,
        marginRight: 'auto',
        padding: `${theme.spacing(4)} 0px ${theme.spacing(4)} ${theme.spacing(
          3.5,
        )}`,
      },
    },

    Redeem__messageContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.75),
      marginBottom: theme.spacing(0.75),
    },

    Redeem__form: {
      padding: 0,
      width: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      marginTop: theme.spacing(2),
      gap: theme.spacing(1.5),
      flexDirection: 'column',

      '& > div:first-child': {
        flex: 'auto',
        width: 'inherit',
      },

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',

        '& > div:first-child': {
          width: 'auto',
        },
      },
    },

    Redeem__formInput: {
      // TODO: Remove this cast when types are fixed in UI
      color: (uiTheme.palette as any).neutral[100],

      '& .MuiOutlinedInput-input': {
        border: 'none',
        borderRadius: 12,
        color: uiTheme.palette.common.white,
        // TODO: Remove this cast when types are fixed in UI
        backgroundColor: (uiTheme.palette as any).neutral[700],

        '&::placeholder': {
          color: uiTheme.palette.common.white,
        },
      },
    },

    Redeem__formButton: {
      width: 'inherit',
      // .MuiButtonBase-root has an outline of 0 by default
      outline: `4px solid ${uiTheme.palette.neutral[900]} !important`,
      height: '44px !important',

      [uiTheme.breakpoints.up('md')]: {
        width: 'auto',
      },
    },

    Redeem__formMobileContainer: {
      display: 'flex',
      width: '100vw',
      padding: `0px ${theme.spacing(2)}`,
    },

    Redeem__formMobileButton: {
      width: 'inherit',
    },

    blurred: {
      pointerEvents: 'none',
    },

    resultPaper: {
      padding: theme.spacing(1, 2),
    },

    errorResult: {
      color: theme.palette.red.main,
    },

    successResult: {
      color: theme.palette.green.main,
    },

    result: {
      ...theme.typography.body2,

      fontWeight: uiTheme.typography.fontWeightMedium,
    },
  }),
)
