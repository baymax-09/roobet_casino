import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type SxThemedPropsRecord, theme } from '@project-atl/ui'

export const styles = {
  Popup: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    background: theme => theme.palette.neutral[900],
    position: 'absolute',
    bottom: 80,
    maxHeight: 230,
    zIndex: 10,
    overflow: 'auto',
    alignItems: 'stretch',

    '&::-webkit-scrollbar': {
      width: 0,
    },
  },
  Item_Selected: {
    background: theme => theme.palette.neutral[800],
  },
} satisfies SxThemedPropsRecord

export const useChatPopupStyles = makeStyles(() =>
  createStyles({
    PopupListItem__text: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',

      '& .MuiListItemText-primary': {
        fontWeight: theme.typography.fontWeightBold,
        color: theme.palette.neutral[100],
      },

      '& .MuiListItemText-secondary': {
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.palette.neutral[300],
      },
    },
  }),
)
