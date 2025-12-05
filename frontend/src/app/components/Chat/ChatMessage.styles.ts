import { lighten } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

const mentionStyles = {
  display: 'flex-inline',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  borderRadius: 10,
  color: uiTheme.palette.common.white,
  background: uiTheme.palette.primary.main,
  padding: '2px 8px',
  fontSize: '0.75rem',
}

export const useChatMessageStyles = makeStyles(theme =>
  createStyles({
    '@keyframes ChatMessage__shaking': {
      '0%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(2px)' },
      '50%': { transform: 'translateX(-2px)' },
      '75%': { transform: 'translateX(2px)' },
      '100%': { transform: 'translateX(0)' },
    },

    ChatMessage: {
      position: 'relative',
      flexShrink: 0,
      marginTop: 8,
      borderRadius: 2,
      '-webkit-text-size-adjust': '100%',
    },

    ChatMessage__deleteIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 15,
      height: 15,
      cursor: 'pointer',

      '&:hover': {
        background: lighten(theme.palette.primary.main, 0.1),
      },
    },

    ChatMessage__loader: {
      background: 'rgba(0, 0, 0, 0.25)',
      marginBottom: 5,

      '&:last-child': {
        marginBottom: 0,
      },
    },

    ChatMessage__wrapper: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },

    ChatMessage__message: ({ username }: { username: string }) => ({
      // TODO fix theme Using a cast here instead of ts-expect-error because we'd have to ignore the whole object
      fontWeight: theme.typography.fontWeightMedium as number,
      wordBreak: 'break-word',
      marginLeft: 2,
      // TODO: Change this to body4 once using new UI Repo + MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.25rem',

      '& a': {
        textDecoration: 'none',
      },

      '& .mention': {
        color: uiTheme.palette.neutral[300],
      },

      // TODO we should serialize usernames when making them classes, usernames could be valid elements
      [`& .${username}`]: {
        ...mentionStyles,
      },
    }),

    ChatMessage__bottomContainer: {
      display: 'flex',
      height: 36,
      padding: theme.spacing(1),
      alignItems: 'center',
      gap: 6,
      borderRadius: 12,
      background: uiTheme.palette.neutral[700],
    },

    ChatMessage__to: {
      // TODO: Change this to body4 once using new UI Repo + MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      color: theme.palette.common.white,
      fontWeight: 500,
    },

    ChatMessage__balanceAmount: {
      // TODO: Change this to body4 once using new UI Repo + MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      color: uiTheme.palette.common.white,
      fontWeight: 500,
    },

    ChatMessage__shake: {
      display: 'inline-block',
      fontStyle: 'italic',
      animation: '$ChatMessage__shaking 0.5s ease-in-out 0s 2',
    },

    BottomContainer__header: {
      // TODO: Change this to body4 once using new UI Repo + MUI V5
      fontSize: '0.75rem',
      fontWeight: 500,
    },

    BottomContainer__balance: {
      // TODO: Change this to body4 once using new UI Repo + MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      color: uiTheme.palette.success[500],
      fontWeight: 500,
    },

    BottomContainer__icon: {
      width: 20,
      height: 20,
    },

    ChatMessage__mention: {
      ...mentionStyles,
    },
  }),
)
