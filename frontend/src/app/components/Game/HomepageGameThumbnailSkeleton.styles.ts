import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface SliderStylesParams {
  breakpoints: {
    slidesPerView: number
    spaceBetween: number
  }
}

export const useHomepageGameThumbnailSkeletonStyles = makeStyles(theme =>
  createStyles({
    GameThumbnail: ({ breakpoints }: SliderStylesParams) => ({
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      marginRight: theme.spacing(1.375),
      flexShrink: 0,
      width: `calc(${100 / breakpoints.slidesPerView}% - ${
        breakpoints.spaceBetween
      }px)`,
      [uiTheme.breakpoints.up('xs')]: {
        height: '14vh',
      },
      [uiTheme.breakpoints.up('sm')]: {
        height: '17vh',
      },
      [uiTheme.breakpoints.up('md')]: {
        height: '18vh',
      },
      [uiTheme.breakpoints.up('lg')]: {
        height: '17vh',
      },
      [uiTheme.breakpoints.up('xl')]: {
        height: '16vh',
      },
    }),

    scaledThumbnail: {
      height: '100%',
      width: '100%',
    },

    GameThumbnail__image: {
      height: '100%',
    },

    TextContainer: {
      marginTop: theme.spacing(1.25),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    TextContainer__title: {
      width: '75%',
    },

    TextContainer__provider: {
      width: '50%',
    },
  }),
)
