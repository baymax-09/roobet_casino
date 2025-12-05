import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

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
      border: '3px dashed rgba(0, 0, 0, 0.12)',
      background: '#fff',
      minHeight: '250px',
      borderRadius: '4px',
      padding: '0 32px',
      position: 'relative',
    },

    dropzone: {
      border: 0,
      minHeight: 'auto',
    },

    hideDropzone: {
      '& $dropzone': {
        display: 'none',
      },
    },

    previewItem: {
      textAlign: 'center',
      maxWidth: '100%',
      flexBasis: '100%',

      '& img': {
        maxWidth: '100px',
      },
    },

    loadingOverlay: {
      background: 'rgba(255, 255, 255, .8)',
      position: 'absolute',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: theme.zIndex?.modal,
    },
  }),
)
