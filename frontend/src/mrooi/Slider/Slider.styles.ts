import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { env } from 'common/constants'

interface SliderStylesParams {
  slidesPerView: number
  spaceBetween?: number
  fullPageSlide: boolean
}

const navButtonBaseStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: 0,
  bottom: 0,
  zIndex: 3,
} as const

export const useSliderStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      position: 'relative',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    header: {
      display: 'flex',
      alignItems: 'center',
      gap: uiTheme.spacing(1),
    },

    SliderContainer: {
      position: 'relative',
    },

    navigation: {
      marginLeft: 'auto',
      display: 'flex',
      gap: theme.spacing(0.25),
    },

    navigationButton: {
      padding: 0,
    },

    navigationButton_left: {
      borderTopRightRadius: '0px !important',
      borderBottomRightRadius: '0px !important',
    },

    navigationButton_right: {
      borderTopLeftRadius: '0px !important',
      borderBottomLeftRadius: '0px !important',
    },

    TitleLinkContainer: {
      textDecoration: 'none',
      width: '100%',
    },

    TitleLinkContainer__wrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    TitleLinkContainer__content: {
      flex: '1 1 0%',
      display: 'flex',
      alignItems: 'center',

      '& * ': {
        ...(env.SEASONAL === 'true' && {
          fontFamily: "'Black And White Picture' !important",
        }),
      },
    },

    ViewAllButton: {
      marginLeft: 'auto',
    },

    slides: {
      position: 'relative',
      display: 'flex',
      overflowX: 'scroll',
      overflowY: 'clip',
      scrollSnapType: 'x mandatory',

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        width: '100%',
        padding: '0px',
      },

      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },

    slide: ({
      slidesPerView,
      spaceBetween,
      fullPageSlide,
    }: SliderStylesParams) => ({
      scrollSnapAlign: 'start',
      flexShrink: 0,
      width: '135px',
      opacity: 1,

      '&:last-of-type': {
        scrollSnapAlign: 'start',
      },

      '&:not(:last-of-type)': {
        marginRight: `${spaceBetween ?? 8}px`,
      },

      [uiTheme.breakpoints.up('md')]: {
        '&:not(:last-of-type)': {
          marginRight: `${spaceBetween ?? 16}px`,
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '143px',
      },
    }),

    // InlineSlider specific classes
    InlineSlider__leftNavButton: {
      left: 0,
      ...navButtonBaseStyles,
    },

    InlineSlider__rightNavButton: {
      right: 0,
      ...navButtonBaseStyles,
    },

    InlineSlider__slides: {
      position: 'relative',
      display: 'flex',
      overflowX: 'scroll',
      overflowY: 'clip',
      scrollSnapType: 'x mandatory',

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        width: '100%',
        padding: '0px',
      },

      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  }),
)
