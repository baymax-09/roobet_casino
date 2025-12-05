import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMessagingMenuItemStyles = makeStyles(() =>
  createStyles({
    MessageMenu: {
      borderRadius: '12px',
      background: 'transparent',
      maxHeight: '70vh',
      display: 'flex',
      overflow: 'hidden',
      // Need to overwrite Paper's default "top" to assure popover is low enough
      top: '64px !important',
      // So annoying but it's not lined up right with the icon button cause of the button outline, so we need this.
      transform: 'translate(4px, 0) !important',
    },

    NotificationContainer: {
      position: 'absolute',
      top: -8,
      right: -8,
    },

    UserMessageListContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '384px',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },
    },
  }),
)
