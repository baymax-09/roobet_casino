import { theme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useChatTopBarStyles = makeStyles(() =>
  createStyles({
    ChatTopBar: {
      padding: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(
        1,
      )} ${theme.spacing(2)}`,
      position: 'relative',
      justifyContent: 'start',
      alignItems: 'end',
      overflow: 'hidden',
      background: theme.palette.neutral[800],
      borderBottom: 'none',
      borderRadius: 0,
      zIndex: 8,
    },

    ChatTopBar__iconButton: {
      '&.MuiButtonBase-root': {
        border: `4px solid ${theme.palette.neutral[900]}`,
        borderRadius: 16,
        marginLeft: 'auto',
      },
    },

    ChatTopBar__topBarBottomGradient: {
      borderRadius: 8,
      display: 'flex',
      position: 'absolute',
      width: '100%',
      top: 56,
      height: 16,
      background: `linear-gradient(180deg, ${theme.palette.neutral[900]} 0%, rgba(9, 12, 29, 0.00) 47.40%)`,
      zIndex: 10,

      [theme.breakpoints.up('md')]: {
        borderRadius: 0,
        top: 0,
        background: `linear-gradient(180deg, ${theme.palette.neutral[900]} 0%, rgba(9, 12, 29, 0.00) 100%)`,
      },
    },
  }),
)
