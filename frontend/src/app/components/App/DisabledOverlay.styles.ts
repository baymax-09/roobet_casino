import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import bg from 'assets/images/bg.jpg'
import logo from 'assets/images/logo.svg'
import { getCachedSrc } from 'common/util'

export const useDisabledOverlayStyles = makeStyles(theme =>
  createStyles({
    Overlay: {
      position: 'fixed',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      zIndex: 9999,
    },

    Overlay_disabled: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.palette.deprecated.primary.dark,
      padding: theme.spacing(2),

      '&:before': {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        content: '" "',
        pointerEvents: 'none',
        background: `url(${getCachedSrc({ src: bg })})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        opacity: 0.08,
      },
    },

    Overlay__logo: {
      width: '100%',
      height: 50,
      backgroundImage: `url(${logo})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      marginBottom: theme.spacing(3),
    },
  }),
)
