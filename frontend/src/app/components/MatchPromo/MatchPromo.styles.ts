import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type SxThemedPropsRecord } from '@project-atl/ui'

export const styles = {
  MatchPromo__eventDialog: {
    padding: theme => theme.spacing(2),
    borderRadius: 0.5,
    // @ts-expect-error TODO AFTER MUI5-UPGRADE
    background: theme => theme.palette.deprecated.primary.main,
    // @ts-expect-error TODO AFTER MUI5-UPGRADE
    color: theme => theme.palette.deprecated.text.secondary,
  },
} satisfies SxThemedPropsRecord

export const useMatchPromoStyles = makeStyles(
  theme =>
    createStyles({
      '@keyframes closeIconEnter': {
        '0%': {
          transform: 'rotate(0deg)',
        },

        '100%': {
          transform: 'rotate(360deg)',
        },
      },

      MatchPromo__closeIcon: {
        animation: '$closeIconEnter 0.3s ease forwards',
      },

      EventDialog_headerBold: {
        lineHeight: '1rem',

        fontWeight: theme.typography.fontWeightBold,
      },

      EventDialog__forfeitButton: {
        display: 'flex',
        margin: '0 auto',
        color: theme.palette.red.main,
      },

      EventDialog__divider: {
        margin: '5px 0',
        marginTop: theme.spacing(1),
        backgroundColor: 'rgb(255, 255, 255, 0.12)',
      },

      EventDialog_subheaderLighten: {
        marginBottom: 4,
        opacity: 0.75,

        '& svg, img': {
          color: '#fff',
        },
      },

      EventDialog__progressBar: {
        position: 'relative',
        height: 10,
        borderRadius: 2,
        background: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginTop: theme.spacing(0.5),
      },

      ProgressBar__currentProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '0%',
        zIndex: 5,
        background: theme.palette.secondary.main,
      },

      EventDialog__leftToWager: {
        marginTop: 3,

        fontWeight: theme.typography.fontWeightMedium,
        fontVariant: 'tabular-nums',
        opacity: 0.6,
        maxWidth: 200,
        display: 'inline',

        '& span': {
          color: theme.palette.secondary.main,
          marginLeft: 2,
          marginRight: 2,
        },
      },

      EventDialog__message: {
        maxWidth: 200,

        fontWeight: theme.typography.fontWeightMedium,
        display: 'inline',

        '& span': {
          color: theme.palette.secondary.main,
          marginLeft: 2,
          marginRight: 2,
        },
      },

      MatchPromo__percentBadge: {
        pointerEvents: 'none',
        position: 'absolute',
        top: -11,
        right: -10,
        zIndex: 5,
        background: '#7d83d5',
        borderRadius: 2,
        padding: '2px 3px',
        fontSize: 9,
        color: '#fff',
        textShadow: '-1px 1px 0px rgb(0, 0, 0, 0.24)',
        boxShadow: '0px 3px 1px rgb(0, 0, 0, 0.28)',
      },

      MatchPromo__item: {
        color: theme.palette.secondary.main,
        listStyleType: 'disc',
      },

      MatchPromo__itemContainer: {
        marginLeft: 10,
      },

      MatchPromo__eventIcon: {
        '&.Mui-disabled': {
          background: theme.palette.primary.main,
          opacity: 0.5,
        },
      },
    }),
  {
    name: 'MatchPromo',
  },
)
