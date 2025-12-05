import { theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

interface StylesProps {
  bgImage: string
}

export const useRegisterNowCarouselBannerStyles = makeStyles(() =>
  createStyles({
    RegisterNowCarouselBanner: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: uiTheme.breakpoints.values.lg,
      width: '100%',
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',
      marginBottom: uiTheme.spacing(2),
      overflow: 'hidden',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        marginBottom: uiTheme.spacing(3),
        height: '296px',
      },

      [uiTheme.breakpoints.up('lg')]: {
        height: '260px',
      },
    },

    RegisterNowCarousel: ({ bgImage }: StylesProps) => ({
      width: '100%',
      height: '188px',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',

      [uiTheme.breakpoints.up('md')]: {
        height: '296px',
      },

      [uiTheme.breakpoints.up('lg')]: {
        height: '260px',
      },
    }),

    RegisterForm: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: uiTheme.spacing(2),
      padding: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
        minWidth: '318px',
      },

      [uiTheme.breakpoints.up('lg')]: {
        minWidth: '407px',
      },
    },

    RegisterForm__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
    },
  }),
)
