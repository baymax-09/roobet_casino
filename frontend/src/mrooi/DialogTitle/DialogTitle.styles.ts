import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDialogTitleStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(1, 2),
    },

    title: {
      ...theme.typography.body2,
      flex: 1,
      color: theme.palette.primary.main,

      fontWeight: theme.typography.fontWeightBold,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      userSelect: 'none',
    },

    closeButton: {
      flexShrink: 0,
      opacity: 0.75,
    },

    dark: {
      background: theme.palette.primary.darker,

      '& $title': {
        color: '#fff',
      },

      '& $closeButton,': {
        color: theme.palette.text.hint,
      },
    },

    light: {
      '& $title': {
        color: '#fff',
      },

      '& $closeButton': {
        color: theme.palette.text.hint,
      },
    },

    compact: {
      padding: theme.spacing(0.5, 2),
    },
  }),
)
