import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCPDFViewStyles = makeStyles(theme =>
  createStyles({
    documentPDFPreview: {
      width: '100% !important',
      height: '100% !important',
    },
  }),
)
