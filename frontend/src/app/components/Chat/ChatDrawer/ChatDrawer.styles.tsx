import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useChatDrawerStyles = makeStyles(() =>
  createStyles({
    ChatDrawer: {
      '& .MuiDrawer-paper': {
        border: 'none',
        position: 'absolute',
        borderRadius: '12px 12px 0px 0px',
        background: uiTheme.palette.neutral[700],
      },
    },

    ChatDrawer__inputContainer: {
      height: 40,
      display: 'flex',
      padding: '12px 12px 12px 16px',
      alignItems: 'center',
      gap: 12,
      alignSelf: 'stretch',
      background: uiTheme.palette.neutral[900],
    },

    ChatDrawer__closeIcon: {
      marginLeft: 'auto',
    },
  }),
)
