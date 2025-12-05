import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { type KOTHFlavor } from 'common/types'

import { TEXT_SHADOW_COLOR, BANNER_BORDER_RADIUS } from './constants'

interface ThemePropsArgs {
  bannerBackgroundImage: string
  startingSoon: boolean
  whichRoo?: KOTHFlavor | null
}

export const useKOTHBannerStyles = makeStyles(() =>
  createStyles({
    // Do not remove.
    KothBanner_force_mobile: {},
    KothBanner_force_medium: {},

    KothBanner: (props: ThemePropsArgs) => ({
      display: 'flex',
      borderRadius: BANNER_BORDER_RADIUS,
      position: 'relative',
      background:
        props.whichRoo === 'astro'
          ? `linear-gradient(180deg, #1F0053 0%, ${uiTheme.palette.primary[500]} 100%)`
          : `linear-gradient(180deg, ${uiTheme.palette.primary[500]} 0%,  ${uiTheme.palette.primary[300]} 100%)`,
      boxShadow: '0px 4px 6px rgb(20 18 43 / 60%)',

      alignItems: 'center',
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',

      '&::before': {
        content: '""',
        backgroundImage: `url(${props.bannerBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: BANNER_BORDER_RADIUS,
      },
    }),

    KothBanner_base: {
      [uiTheme.breakpoints.up('md')]: {
        padding: ` ${uiTheme.spacing(0)} ${uiTheme.spacing(
          3,
        )} ${uiTheme.spacing(0)} ${uiTheme.spacing(3)}`,
        gap: 0,
        height: 172,
        justifyContent: 'space-between',
        flexDirection: 'row',
      },

      [uiTheme.breakpoints.up('lg')]: {
        padding: ` ${uiTheme.spacing(0)} ${uiTheme.spacing(
          5.25,
        )} ${uiTheme.spacing(0)} ${uiTheme.spacing(5.25)}`,
      },
    },

    KothBanner_mobile: (props: ThemePropsArgs) => ({
      padding: `${uiTheme.spacing(2)} ${uiTheme.spacing(2)} ${uiTheme.spacing(
        4.5,
      )} ${uiTheme.spacing(2)}`,
      gap: props.startingSoon ? 0 : uiTheme.spacing(1.5),
      height: props.startingSoon ? 132 : 288,
      justifyContent: 'center',
      flexDirection: 'column',
    }),

    CountdownContainer: {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      order: 2,
    },

    KothBanner__currentKingContainer: {
      position: 'relative',
      display: 'contents',

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          display: 'contents',
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        order: 2,
      },

      [uiTheme.breakpoints.up('lg')]: {
        left: 0,
        right: 0,
      },

      '$KothBanner_force_medium &': {
        [uiTheme.breakpoints.between('lg', 'xl')]: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: '50%',
          order: 2,
        },
      },
    },

    CurrentKing: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: uiTheme.palette.secondary[600],
      borderRadius: '0px 0px 12px 12px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(1)}`,
      textTransform: 'uppercase',

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          left: '50%',
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        left: '50%',
      },
    },

    BottomMessage: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          left: '50%',
          width: 'initial',
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        left: '50%',
        width: 'initial',
      },
    },

    BottomMessage__multiplierText: {
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px 12px 0px 0px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(1)}`,
      width: 'fit-content',
    },

    BottomMessage__explainer: {
      width: '100%',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(1)} !important`,
      borderRadius: `0px 0px ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px`,
    },

    TitleBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: uiTheme.spacing(1.5),
      zIndex: 2,

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          alignItems: 'center',
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        alignItems: 'flex-start',
      },
    },

    TitleBlock_order: {
      order: 2,
      width: '100%',

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          order: 2,
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        order: 1,
        width: '240px',
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '400px',
      },
    },

    TitleBlock__textContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        alignItems: 'flex-start',
      },
    },

    TitleBlock__headerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      [uiTheme.breakpoints.up('md')]: {
        justifyContent: 'flex-start',
      },
    },

    Title__header: {
      textShadow: `0px 4px 0px ${TEXT_SHADOW_COLOR}`,
    },

    Title__subheader: {
      textShadow: `0px 2px 0px ${TEXT_SHADOW_COLOR}`,
    },

    Title__subheaderContainer: {
      display: 'flex',
      gap: uiTheme.spacing(0.5),
      alignItems: 'center',
    },

    Earnings: {
      color: uiTheme.palette.success[500],
    },

    KothBanner__currentKing: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      backgroundColor: uiTheme.palette.neutral[900],
      padding: ` ${uiTheme.spacing(1.25)} ${uiTheme.spacing(
        1.25,
      )} ${uiTheme.spacing(1.25)} ${uiTheme.spacing(8.25)}`,
      gap: uiTheme.spacing(1.5),
      borderRadius: '16px',
      minWidth: 242,

      '$KothBanner_force_medium &': {
        [uiTheme.breakpoints.up('md')]: {
          marginRight: 0,
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        marginRight: uiTheme.spacing(3.75),
      },
    },

    KothBanner__currentKing_gameImage: {
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(
        0.5,
      )} ${uiTheme.spacing(0.5)} ${uiTheme.spacing(8.25)}`,
    },

    KothBanner__currentKing_order: {
      order: 1,

      '$KothBanner_force_mobile &': {
        [uiTheme.breakpoints.between('md', 'xl')]: {
          order: 1,
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        order: 2,
      },
    },

    KothBanner__crownAnimation: {
      position: 'absolute',
      left: '-30px',
    },

    InfoIcon: {
      position: 'absolute',
      top: 16,
      right: 16,
      cursor: 'pointer',

      '&:hover': {
        '& .Ui-fill': {
          fill: uiTheme.palette.common.white,
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        top: 21,
        right: 21,
      },
    },

    CallToActionContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      order: 3,
    },

    CallToActionContainer_isTabletOrDesktop: {
      borderRadius: '16px',
      gap: uiTheme.spacing(1.5),
      padding: uiTheme.spacing(1.25),
      backgroundColor: uiTheme.palette.neutral[900],
    },

    KingContainer: {
      display: 'flex',
      gap: uiTheme.spacing(1.5),
      width: '100%',
    },

    KingContainer__text: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      width: '100%',
    },

    KingContainer__text__currentKing: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: uiTheme.spacing(1),
    },

    KingContainer_link: {
      height: '48px',
      minWidth: '48px',
      width: '48px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      textDecoration: 'none',
      overflow: 'hidden',
      color: uiTheme.palette.common.white,
    },

    KingContainer_gameImage: {
      height: '48px',
      minWidth: '48px',
      width: '48px',
      borderRadius: '12px',
      position: 'relative',
      overflow: 'hidden',

      '&:after': {
        display: 'none',
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        border: `2px solid ${uiTheme.palette.common.white}`,
        borderRadius: '12px',
      },

      '&:hover:after': {
        display: 'block',
      },
    },
  }),
)
