import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLabelStyles = makeStyles(() =>
  createStyles({
    label: {
      display: 'block',
      color: '#797b95',
      fontWeight: 500,
      fontSize: '12px',
      marginBottom: '5px',
      userSelect: 'none',
      lineHeight: '12px',
    },
  }),
)
