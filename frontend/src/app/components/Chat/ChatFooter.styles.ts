import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useChatFooterStyles = makeStyles(theme =>
  createStyles({
    ChatFooter: {
      flexShrink: 0,
      background: uiTheme.palette.neutral[800],
      padding: theme.spacing(2),
      paddingBottom: theme.spacing(1),
    },

    ChatFooter__inputContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 8,
      height: 40,
      gap: 6,

      '& > div:first-child': {
        flex: 1,
      },
    },

    InputContainer__inputField: {
      height: '40px !important',
      background: `${uiTheme.palette.neutral[900]} !important`,

      '&.MuiInputBase-root': {
        width: '100%',
        borderRadius: `${theme.spacing(1)} !important`,
      },
    },

    InputContainer__textField: {
      ...theme.typography.body2,
      padding: theme.spacing(1.2),
      // TODO: Change to body4 once using MUI V5
      fontSize: '0.875rem !important',
      lineHeight: '1.25rem',

      fontWeight: `${theme.typography.fontWeightMedium} !important`,
    },

    InputContainer__sendButton: {
      borderRadius: `${theme.spacing(1)} !important`,
    },

    ChatFooter__actionContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      // TODO: Change to body4 once using MUI V5
      fontSize: '0.75rem',
    },

    ActionContainer__actionButton: {
      '&.MuiButtonBase-root': {
        minWidth: 26,
        color: uiTheme.palette.neutral[400],
        padding: 0,
      },
    },

    ActionContainer__characterCount: {
      flex: 1,
      textAlign: 'right',
      userSelect: 'none',
      color: uiTheme.palette.neutral[600],
    },

    EmojiMenu: {
      minWidth: 'unset',
      background: 'rgba(255, 255, 255, 0.3)',
      width: '50%',
      height: 25,
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '0px 5px',
    },

    EmojiMenu__button: {
      width: '25%',
      height: '100%',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: theme.palette.secondary.main,
      },
    },

    EmojiMenu_selectedEmoji: {
      backgroundColor: `${theme.palette.secondary.main} !important`,
    },
  }),
)
