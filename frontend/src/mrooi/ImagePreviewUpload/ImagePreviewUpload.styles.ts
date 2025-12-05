import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useImagePreviewUploadStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      width: '100%',
      minHeight: '250px',
      height: '100%',
      position: 'relative',

      '& .MuiFormGroup-root': {
        width: '100%',
      },
    },

    helpText: {
      marginTop: theme.spacing(1),
      fontSize: '0.8rem',
    },

    // Do not remove these.
    dragActive: {},
    fileActive: {},

    dropZone: {
      width: '100%',
      height: '100%',
      background: '#F8F8F8',
      border: '1px dashed #000000',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center',

      '$dragActive &': {
        background: '#E2E2E2',
      },
    },

    dropZoneTitle: {
      color: '#1E252F',
      fontSize: '1.5rem',

      fontWeight: theme.typography.fontWeightMedium,
      marginBottom: theme.spacing(2),
    },

    imgPreviewContainer: {
      background: 'rgba(0,0,0,.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    },

    imgPreview: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',

      '$dragActive &': {
        opacity: '0.7',
      },
    },

    fileInput: {
      display: 'none',
    },

    actions: {
      display: 'none',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '62px',
      background: 'rgba(0, 0, 0, 0.35)',
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,

      '$fileActive:not($dragActive) &': {
        display: 'block',
      },
    },

    actionBtn: {
      color: '#fff',
      margin: `0 ${theme.spacing(2)} 0 0`,
      background: 'rgba(255, 255, 255, 0.1)',
      height: '44px',
      padding: 0,
      borderRadius: '9px',
      minWidth: 'auto',
      width: '44px',
    },
  }),
)
