import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useTPGamesEditRouteStyles = makeStyles(theme =>
  createStyles({
    GameEditRoute__formContainer: {
      padding: theme.spacing(2),
      maxWidth: 'max-content',
    },

    form: {
      '& > div': {
        margin: `${theme.spacing(2)} 0`,
      },
    },

    imageUploadContainer: {
      padding: `${theme.spacing(2)} 0`,

      '& .MuiFormLabel-root': {
        display: 'block',
        marginBottom: theme.spacing(1),
      },
    },

    imageUpload: {
      width: '250px',
      height: '250px',
    },

    statusSelect: {
      marginTop: '5px !important',
    },

    blocklist: {
      padding: theme.spacing(1),
    },

    blockList_container: {
      paddingTop: theme.spacing(1),
    },

    Dialog__footer: {
      display: 'flex',
      justifyContent: 'flex-end',
    },

    Button__addMargin: {
      marginRight: theme.spacing(1.25),
    },

    Chip__Color: {
      '&.MuiChip-root': {
        margin: theme.spacing(0.5),
        backgroundColor: uiTheme.palette.primary.main,
        color: uiTheme.palette.common.white,
      },
    },
    Stack__Blocklist: {
      flexWrap: 'wrap',
    },
  }),
)
