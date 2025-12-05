import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSameFingerprintsStyles = makeStyles(() =>
  createStyles({
    expandedRow: {
      background: '#f5f5f5',
    },

    toolbarActions: {
      display: 'flex',
      float: 'left',

      '& > *': {
        margin: '0 4px',
        position: 'relative',
        top: '3px',
      },
    },
  }),
)
