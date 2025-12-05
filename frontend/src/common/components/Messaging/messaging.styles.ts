import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface StylesProps {
  linkPresent?: boolean
  read?: boolean
}

export const cardRootStyles = ({ read, linkPresent }: StylesProps) => ({
  backgroundColor: read
    ? uiTheme.palette.neutral[800]
    : `${uiTheme.palette.neutral[600]}3D`,
  color: uiTheme.palette.neutral[300],
  borderRadius: '0',
  textDecoration: 'none',

  '& a': {
    textDecoration: 'none',
  },

  ...(linkPresent && {
    cursor: 'pointer',

    '&:hover': {
      backgroundColor: `${uiTheme.palette.neutral[600]}7A`,
    },
  }),
})

export const useMessagingStyles = makeStyles(theme =>
  createStyles({
    // Do not remove.
    hasLink: {},

    container: {
      display: 'flex',
      flexDirection: 'column',
      padding: `${theme.spacing(2)} !important`,
    },

    content: {
      display: 'flex',
      gap: theme.spacing(2),
    },

    copy: {
      display: 'flex',
      flexDirection: 'column',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      gap: theme.spacing(0.5),
    },

    link: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',

      '& .MuiSvgIcon-root': {
        width: '0.9em',
        fill: theme.palette.secondary.main,
      },
    },

    hero: {
      width: '100%',
      height: '120px',
      flexShrink: 0,
      marginBottom: theme.spacing(2),
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    },
  }),
)
