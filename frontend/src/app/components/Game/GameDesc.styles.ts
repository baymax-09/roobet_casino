import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameDescStyles = makeStyles(() =>
  createStyles({
    GameDescContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    GameDesc: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('lg')]: {
        flexDirection: 'row',
        alignItems: 'flex-start',
      },
    },

    GameDesc__text: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
    },

    GameDesc__tags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('lg')]: {
        marginLeft: 'auto',
      },
    },

    GameDesc__tags_tag: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${uiTheme.spacing(0.75)} ${uiTheme.spacing(1.25)}`,
      borderRadius: '12px',
      textDecoration: 'none',
      boxSizing: 'border-box',
      border: '2px solid transparent',
    },

    GameDesc__tags_tag_provider: {
      backgroundColor: uiTheme.palette.success[700],

      '&:hover': {
        border: `2px solid ${uiTheme.palette.success.main}`,
      },
    },

    GameDesc__tags_tag_tag: {
      backgroundColor: uiTheme.palette.primary[700],

      '&:hover': {
        border: `2px solid ${uiTheme.palette.primary.main}`,
      },
    },
  }),
)
