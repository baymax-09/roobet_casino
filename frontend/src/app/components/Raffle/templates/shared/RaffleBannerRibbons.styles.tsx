import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useRaffleBannerRibbonsStyles = makeStyles(theme =>
  createStyles({
    RaffleBanner__ribbons: {
      display: 'flex',
      height: 'auto',
      width: 'calc(100% + 16px)',
      color: 'white',
      padding: '0 4px',
      justifyContent: 'space-between',
      flexDirection: 'row',
      margin: '8px 0 -8px -8px',

      [theme.breakpoints.up('sm')]: {
        padding: 'initial',
      },

      [theme.breakpoints.up('md')]: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 188,
        margin: 'initial',
      },
    },

    Ribbons__ticketRibbon: {
      opacity: 1,
      left: '150px !important',
      transform: 'translate3x(0px, 0px, 0px)',
      transition: '.3s ease',
      zIndex: 5,

      '& > span': {
        background: '#2196f3 !important',

        '&:after': {
          background: '#135c96 !important',
        },

        '&:before': {
          background: '#2196f3 !important',
        },
      },

      '&:after': {
        borderTopColor: '#2196f3 !important',
      },
    },

    Ribbons__winnersRibbon: {
      width: '50%',
      margin: 6,
      borderRadius: 8,

      '& > span': {
        width: '100%',
        fontSize: 18,
        borderRadius: 8,
        position: 'relative',
        display: 'block',
        textAlign: 'center',
        background: theme.palette.green.main,
        fontWeight: theme.typography.fontWeightBold,
        lineHeight: '1',
        padding: '6px 8px 6px',

        [theme.breakpoints.up('sm')]: {
          padding: '10px 8px 8px',
        },
        '& > p': {
          opacity: 0.7,
          lineHeight: '14px',
        },

        '& > div': {
          fontSize: 12,
        },
      },

      [theme.breakpoints.up('md')]: {
        zIndex: 10,
        width: 'initial',
        margin: 'initial',
        position: 'absolute',
        top: -6.1,
        left: 20,
        boxShadow: '1px 1px 5px #1c1f31b5',
        borderRadius: '0px 8px 0px 0px',

        '&:after': {
          display: 'initial',
          position: 'absolute',
          left: 0,
          content: '""',
          width: 0,
          height: 0,
          borderLeft: '53px solid transparent',
          borderRight: '53px solid transparent',
          borderTop: `10px solid ${theme.palette.green.main}`,
        },

        '&:before': {
          display: 'initial',
        },

        '& > span': {
          position: 'relative',
          display: 'block',
          textAlign: 'center',
          background: theme.palette.green.main,
          fontSize: 24,
          fontWeight: theme.typography.fontWeightBold,
          lineHeight: '1',
          padding: '10px 8px 8px',
          borderRadius: '0px 8px 0px 0px',
          width: 106,

          '& > p': {
            opacity: 0.7,
            lineHeight: '14px',
          },

          '&:before': {
            display: 'initial',
            position: 'absolute',
            content: '""',
            background: theme.palette.green.main,
            height: 6,
            width: 6,
            left: -6,
            top: 0,
          },

          '&:after': {
            display: 'initial',
            position: 'absolute',
            content: '""',
            background: theme.palette.green.darker,
            height: 6,
            width: 8,
            left: -8,
            top: 0,
            borderRadius: '8px 8px 0 0',
          },
        },
      },
    },
  }),
)
