import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSponsorsRouteStyles = makeStyles(() =>
  createStyles({
    balance: {
      display: 'flex',
      gap: '10px',
    },

    balanceModifier: {
      opacity: 0.6,

      '&:hover': {
        opacity: 1,
        cursor: 'pointer',
        textDecoration: 'underline',
      },
    },
  }),
)
