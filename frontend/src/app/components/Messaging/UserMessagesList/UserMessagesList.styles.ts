import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useUserMessagesListStyles = makeStyles(theme =>
  createStyles({
    UserMessageList: {
      borderRadius: 'inherit',

      [uiTheme.breakpoints.up('sm')]: {
        overflowY: 'auto',
        height: 'fit-content',
        maxHeight: '576px',

        '&::-webkit-scrollbar': {
          width: 0,
          height: 0,
        },

        '@supports (scrollbar-width: none)': {
          scrollbarWidth: 'none',
        },
      },
    },

    MessageItems__item: {
      '&:not(:last-child)': {
        borderBottom: `2px solid ${uiTheme.palette.neutral[700]}`,
      },
    },
    NoItemsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(3),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: uiTheme.palette.neutral[800],
    },
  }),
)
