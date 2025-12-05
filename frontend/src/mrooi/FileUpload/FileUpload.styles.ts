import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFileUploadStyles = makeStyles(theme =>
  createStyles({
    root: {
      color: 'rgba(0, 0, 0, 0.87)',
    },

    container: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '250px',
      borderRadius: '12px',
      position: 'relative',
      backgroundColor: uiTheme.palette.neutral[700],
      border: `2px dashed ${uiTheme.palette.primary[500]}`,
      padding: uiTheme.spacing(2),

      '& > .MuiDropzoneArea-root': {
        backgroundColor: 'transparent',
      },

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
      },
    },

    FileUpload__textContainer: {
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(2),
    },

    hideDropzone: {
      '& $dropzone': {
        display: 'none',
      },
    },

    FileUpload__icon: {
      color: uiTheme.palette.neutral[500],
    },

    FileUpload__previewItem: {
      textAlign: 'center',
      maxWidth: '100%',
      flexBasis: '100%',
      color: uiTheme.palette.common.white,

      '& img': {
        maxWidth: '100px',
      },

      '& p': {
        fontFamily: 'Excon',
      },
    },

    LoadingOverlay: {
      position: 'absolute',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: theme.zIndex?.modal,
      gap: uiTheme.spacing(2),
    },

    LoadingOverlay__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ButtonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 2,
      width: '100%',
    },

    Button: {
      [uiTheme.breakpoints.up('md')]: {
        width: '128px',
      },
    },
  }),
)
