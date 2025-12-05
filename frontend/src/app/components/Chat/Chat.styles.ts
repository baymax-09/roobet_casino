import { theme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useChatStyles = makeStyles(() =>
  createStyles({
    Chat: {
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      color: '#f4f4f4',
      background: 'rgb(66 60 122 / 85%)',
    },

    Chat__wrapper: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
    },

    Chat__messages: {
      flex: 1,
      overflow: 'hidden',
      overflowY: 'auto',
      flexWrap: 'nowrap',
      padding: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(
        0,
      )} ${theme.spacing(2)}`,
      width: '100%',
      background: theme.palette.neutral[800],

      '&::-webkit-scrollbar': {
        width: 0,
      },
    },

    ChatBanner__scrollBottom: {
      display: 'flex',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing(1, 2),
      gap: theme.spacing(1),
      background: theme.palette.primary[500],
      cursor: 'pointer',
      zIndex: 5,
      fontWight: 700,
      // TODO: Change to body4 once using MUI V5
      fontSize: '0.75rem',
    },

    ChatBanner__message: {
      // TODO: Change to body4 once using MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 700,
    },

    ChatBanner__scrollBottom_error: {
      cursor: 'initial',
      background: theme.palette.error[500],
    },

    Chat_searchOpened: {
      filter: 'blur(5px)',
    },
  }),
)
