import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useProfileNameStyles = makeStyles(() =>
  createStyles({
    ProfileName: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',

      '&:hover': {
        textDecoration: 'underline',
      },
    },

    ProfileName__staffContainer: {
      fontWeight: 700,
      padding: '2px 5px',
      background: uiTheme.palette.primary.main,
      border: `solid 2px ${uiTheme.palette.primary[700]}`,
      borderRadius: '3px',
      color: uiTheme.palette.primary[25],
      marginRight: '5px',
    },

    ProfileName__username: {
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: '1rem',
    },
  }),
)
