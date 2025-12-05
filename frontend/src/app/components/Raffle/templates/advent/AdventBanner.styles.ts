import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

interface AdventBannerStylesParams {
  compact: boolean
  featureImageSrc: string
}

export const useAdventBannerStyles = makeStyles(theme =>
  createStyles({
    AdventBanner: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
    },

    AdventBanner__background: ({
      compact,
      featureImageSrc,
    }: AdventBannerStylesParams) => ({
      backgroundImage: `url(${featureImageSrc})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: compact ? 'top' : 'center',
      width: '100%',
      maxWidth: 655,
      height: '100%',
      maxHeight: 250,
      filter: 'drop-shadow(0px 6px 3px rgba(0, 0, 0, 0.3))',
    }),

    AdventBanner__countdown: {
      fontWeight: 700,
      lineHeight: '1.5rem',
      textShadow: '0px 4px 0px rgb(0, 0, 0 , 0.25)',
    },

    AdventBanner__message: {
      display: 'flex',
      textShadow: '0px 4px 0px rgb(0, 0, 0 , 0.25)',
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(5),

      '& > img': {
        verticalAlign: 'middle',
        marginRight: theme.spacing(0.5),
      },
    },

    Message__ticketCount: {
      marginLeft: theme.spacing(1),
      fontWeight: 800,
      lineHeight: '1.8rem',
    },

    AdventBanner__showWinners: {
      marginTop: '15px',
      fontSize: '17px',
    },
  }),
)
