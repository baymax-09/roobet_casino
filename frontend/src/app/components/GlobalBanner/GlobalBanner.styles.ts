import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGlobalBannerStyles = makeStyles(theme =>
  createStyles({
    GlobalBanner: {
      borderRadius: 0,
      background: 'rgba(0, 0, 0, 0.17)',
      justifyContent: 'center',
      padding: '5px 25px',
    },

    GlobalBanner__message: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      maxWidth: uiTheme.breakpoints.values.lg,
    },

    Message__text: {
      flex: 1,

      fontWeight: theme.typography.fontWeightMedium,
      '& button': {
        marginLeft: theme.spacing(1),
      },
      '& a': {
        color: '#ddb53f',
      },
    },

    GlobalBanner__titleLink: {
      display: 'inline-block',
      color: '#fff',

      fontWeight: theme.typography.fontWeightMedium,
      textDecoration: 'underline',
    },

    GlobalBanner__closeButton: {
      color: '#fff',
      opacity: 0.6,
    },
  }),
)
