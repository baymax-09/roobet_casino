import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import bg from 'assets/images/bg.jpg'
import { getCachedSrc } from 'common/util'

export const useLocaleDialogStyles = makeStyles(theme =>
  createStyles({
    LocaleDialog: {
      background: theme.palette.primary.main,
      borderLeft: '1px solid rgba(0, 0, 0, 0.3)',
      '&::-webkit-scrollbar': {
        width: 0,
        height: 0,
      },

      '&:before': {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        content: '" "',
        zIndex: -2,
        backgroundImage: `url(${getCachedSrc({ src: bg })})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundPositionX: -400,
        opacity: 0.2,
      },
    },

    LocaleDialog__dialogContent: {
      padding: '0px !important',
    },

    DialogContent_listItems: {
      width: '100%',
      padding: 0,
      borderTop: `1px solid ${theme.palette.deprecated.primary.dark}`,
      borderBottom: `1px solid ${theme.palette.deprecated.primary.dark}`,
    },

    DialogContent__header: {
      display: 'flex',
      alignItems: 'center',
      height: '80px',
      padding: theme.spacing(2),
      backdropFilter: 'blur(4px)',
      background: '#33365e',
      flexShrink: 0,
    },

    Header__message: {
      color: 'white',

      fontWeight: theme.typography.fontWeightBold,
      lineHeight: '20px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    ListItems__item: {
      color: 'white',
      height: '60px',
      borderTop: `1px solid ${theme.palette.deprecated.primary.dark}`,
      borderBottom: `1px solid ${theme.palette.deprecated.primary.dark}`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    Item__icon: {
      width: '32px',
      borderRadius: '4px',
    },
  }),
)
