import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAdventRaffleBannerStyles = makeStyles(theme =>
  createStyles({
    RaffleBanner__feature: {
      position: 'absolute',
      top: 0,
      right: 20,
      bottom: 0,
      width: 150,
      zIndex: 0,
      height: '100%',
      padding: 0,
      display: 'none',

      [uiTheme.breakpoints.up('md')]: {
        display: 'block',
      },

      '&:before, &:after': {
        position: 'absolute',
        content: '" "',
        opacity: 0.3,
      },

      '&:before': {
        top: 'calc(50% - 40%)',
        left: 'calc(50% - 40%)',
        width: '80%',
        height: '80%',
        background: theme.palette.primary.main,
        borderRadius: '50%',
      },

      '&:after': {
        top: 'calc(50% - 33%)',
        left: 'calc(50% - 33%)',
        width: '66%',
        height: '66%',
        background: '#44476f',
        borderRadius: '50%',
        zIndex: 5,
      },
    },

    Feature__image: {
      transition: '.3s ease',
      position: 'absolute',
      top: -20,
      right: -20,
      left: -20,
      bottom: -20,
      zIndex: 10,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      filter: 'drop-shadow(0px 0px 20px rgba(255, 255, 255, 0.3))',
    },
  }),
)
