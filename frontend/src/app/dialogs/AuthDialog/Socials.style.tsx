import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useSocialStyles = makeStyles(theme =>
  createStyles({
    divider: {
      position: 'relative',
      width: '100%',
      textAlign: 'center',

      fontWeight: theme.typography.fontWeightMedium,
      color: uiTheme.palette.common.white,

      '&:before': {
        position: 'absolute',
        top: '50%',
        left: 0,
        height: 2,
        width: 'calc(50% - 60px)',
        content: '" "',
        background: uiTheme.palette.neutral[700],
      },

      '&:after': {
        position: 'absolute',
        top: '50%',
        right: 0,
        height: 2,
        width: 'calc(50% - 60px)',
        content: '" "',
        background: uiTheme.palette.neutral[700],
      },
    },

    Socials: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      gap: theme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    Socials__social: {
      display: 'flex',
      flex: '1 1 0',
      color: uiTheme.palette.common.white,
      justifyContent: 'center',
      alignItems: 'center',

      '& img': {
        height: 16,
      },
    },
  }),
)
