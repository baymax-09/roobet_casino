import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { BANNER_BORDER_RADIUS, BANNER_DESKTOP_HEIGHT } from '../constants'

interface ThemePropsArgs {
  bannerBackgroundImage: string
}

export const useGeneralBannerStyles = makeStyles(theme =>
  createStyles({
    GeneralBanner: (props: ThemePropsArgs) => ({
      display: 'flex',
      flexDirection: 'column',
      borderRadius: BANNER_BORDER_RADIUS,
      marginBottom: uiTheme.spacing(3),
      justifyContent: 'center',
      position: 'relative',
      background: 'linear-gradient(91deg, #751E13 0%, #99381E 100%)',
      boxShadow: '0px 4px 6px rgb(20 18 43 / 60%)',
      padding: uiTheme.spacing(2),
      alignItems: 'center',
      gap: uiTheme.spacing(1.5),

      '&::before': {
        content: '""',
        backgroundImage: `url(${props.bannerBackgroundImage})`,
        backgroundSize: 'cover',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: BANNER_BORDER_RADIUS,
      },

      [uiTheme.breakpoints.up('md')]: {
        padding: 0,
        paddingLeft: uiTheme.spacing(5.25),
        height: BANNER_DESKTOP_HEIGHT,
        justifyContent: 'space-between',
        flexDirection: 'row',
      },
    }),

    GeneralBanner__innerContent: {
      display: 'flex',
      color: uiTheme.palette.common.white,
      flexDirection: 'column',
      alignItems: 'center',
      alignSelf: 'center',
      height: '100%',
      justifyContent: 'center',
      zIndex: 1,
      gap: theme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        justifyContent: 'center',
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: 'initial',
      },
    },

    GeneralBanner_bottomPadding: {
      paddingBottom: `${theme.spacing(5)} !important`,
    },

    RightMostContainer_tabletAbsolute: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      top: 0,
    },

    RightMostContainer_desktopAbsolute: {
      position: 'absolute',
      left: '50%',
      bottom: 0,
      top: 0,
      transform: 'translateX(-50%)',
    },
  }),
)
