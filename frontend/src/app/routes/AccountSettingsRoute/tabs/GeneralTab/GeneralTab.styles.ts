import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGeneralTabStyles = makeStyles(theme =>
  createStyles({
    GeneralTabInput: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      alignItems: 'flex-start',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        alignItems: 'flex-end',
      },
    },

    GeneralTab__actions: {
      width: '100%',
      // To ensure button is aligned with the input field
      marginBottom: '-4px',

      [uiTheme.breakpoints.up('md')]: {
        width: 'initial',
      },
    },

    GeneralTab__button: {
      height: '52px !important',

      [uiTheme.breakpoints.up('md')]: {
        minWidth: '8rem',
        width: '8rem',
      },
    },

    BottomMessage: {
      textAlign: 'right',
      color: uiTheme.palette.secondary[500],
    },

    BottomMessage_error: {
      color: uiTheme.palette.error[500],
    },

    GeneralTab__actions_alignCenter: {
      alignSelf: 'center',
    },
  }),
)
