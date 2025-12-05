import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useProviderThumbnailStyles = makeStyles(() =>
  createStyles({
    Provider: {
      display: 'flex',
      alignItems: 'center',
      height: '72px',
      borderRadius: '12px',
      transition: 'background 250ms ease',
      padding: uiTheme.spacing(0.5),
      gap: uiTheme.spacing(0.5),
      textDecoration: 'none',
      backgroundColor: uiTheme.palette.neutral[800],

      '&:hover': {
        background: uiTheme.palette.neutral[700],
      },
    },

    ProviderImageWrapper: {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ProviderImage: {
      width: '4rem',
      maxHeight: '4rem',
      borderRadius: '8px',
    },
  }),
)
