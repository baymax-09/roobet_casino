import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

const commonPaddingStyles = {
  paddingBottom: uiTheme.spacing(1),

  '&:last-child': {
    paddingBottom: 0,
  },

  [uiTheme.breakpoints.up('md')]: {
    paddingBottom: uiTheme.spacing(1.5),
  },
}

export const useBasicPageStyles = makeStyles(() =>
  createStyles({
    BasicPage: {
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    BasicPage__container: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',
      margin: '0 auto',
      maxWidth: uiTheme.breakpoints.values.lg,

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    BasicPage__titleContainer: {
      display: 'flex',
    },

    BasicPage__mainContentContainer: {
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',
      color: uiTheme.palette.neutral[400],
      padding: uiTheme.spacing(2),
      fontSize: uiTheme.typography.body2.fontSize,
      lineHeight: uiTheme.typography.body2.lineHeight,

      fontWeight: uiTheme.typography.fontWeightMedium,
      fontFamily: uiTheme.typography.fontFamily,

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        fontSize: uiTheme.typography.body1.fontSize,
        lineHeight: uiTheme.typography.body1.lineHeight,
      },

      '& b': {
        color: uiTheme.palette.neutral[200],
        fontWeight: uiTheme.typography.fontWeightBold,
      },

      '& a': {
        color: uiTheme.palette.neutral[400],
        fontWeight: uiTheme.typography.fontWeightBold,

        '&:hover': {
          color: uiTheme.palette.common.white,
        },
      },

      '& em': {
        fontWeight: uiTheme.typography.fontWeightBold,
      },

      '& p': { ...commonPaddingStyles },

      '& li': {
        marginLeft: uiTheme.spacing(4),
      },

      '& ul': {
        listStyleType: 'disc',
        ...commonPaddingStyles,
      },

      '& ol': {
        listStyleType: 'decimal',
        ...commonPaddingStyles,
      },

      '& h2, h3, h4, h5, h6': {
        ...commonPaddingStyles,
        color: uiTheme.palette.neutral[200],
        fontWeight: uiTheme.typography.fontWeightBold,
      },

      '& h2, h3, h4, h5': {
        '&:not(:first-child)': {
          paddingTop: uiTheme.spacing(0.5),
        },
      },

      // Avoid first element getting extra top padding
      '& > span > :first-child': {
        paddingTop: '0px !important',
      },

      /*  Hasan + Melissa wanted to add this custom header size (the one that isn't using a themed header below).
      To ensure that we are still using valid HTML tag headers, and they will prob never use our h2 header for these pages,
      h3 will take the place of h2. */

      '& h2': {
        fontSize: uiTheme.typography.h4.fontSize,
        lineHeight: uiTheme.typography.h3.lineHeight,

        [uiTheme.breakpoints.up('md')]: {
          fontSize: uiTheme.typography.h3.fontSize,
          lineHeight: uiTheme.typography.h3.lineHeight,
        },
      },

      '& h3': {
        fontSize: uiTheme.typography.h5.fontSize,
        lineHeight: uiTheme.typography.h5.lineHeight,

        [uiTheme.breakpoints.up('md')]: {
          fontSize: uiTheme.typography.h4.fontSize,
          lineHeight: uiTheme.typography.h4.lineHeight,
        },
      },

      '& h4': {
        // The custom size Hasan + Melissa want
        fontSize: '1.5rem',
        lineHeight: '2rem',

        [uiTheme.breakpoints.up('md')]: {
          fontSize: uiTheme.typography.h5.fontSize,
          lineHeight: uiTheme.typography.h5.lineHeight,
        },
      },

      '& h5': {
        fontSize: uiTheme.typography.h6.fontSize,
        lineHeight: uiTheme.typography.h6.lineHeight,

        [uiTheme.breakpoints.up('md')]: {
          // The custom size Hasan + Melissa want
          fontSize: '1.5rem',
          lineHeight: '2rem',
        },
      },

      '& h6': {
        fontSize: uiTheme.typography.body1.fontSize,
        lineHeight: uiTheme.typography.body1.lineHeight,

        [uiTheme.breakpoints.up('md')]: {
          fontSize: uiTheme.typography.h6.fontSize,
          lineHeight: uiTheme.typography.h6.lineHeight,
        },
      },
    },
  }),
)
