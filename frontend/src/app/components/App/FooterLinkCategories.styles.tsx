import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFooterLinkCategoriesStyles = makeStyles(theme =>
  createStyles({
    FooterLinkCategories: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      flexGrow: 1,

      [uiTheme.breakpoints.up('md')]: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
      },

      [uiTheme.breakpoints.up('lg')]: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
      },
    },

    SocialLinkContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'right',
      maxWidth: 300,
      width: '100%',
      marginTop: theme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        width: 120,
        marginRight: 85,
        marginTop: 0,
      },
    },

    SocialLinkContainerButtonContainer: {
      gap: theme.spacing(3),
      display: 'flex',

      [uiTheme.breakpoints.up('md')]: {
        display: 'grid',
        justifyItems: 'baseline',
        gridTemplateRows: 'repeat(2, 1fr)',
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
    },

    SocialLinkContainerButtonContainer__title: {
      marginBottom: uiTheme.spacing(1),
    },

    SocialLinkContainerButtonContainer__item: {
      minWidth: 0,
      padding: 0,
      color: uiTheme.palette.neutral[400],

      '&:hover': {
        background: 'none',
        color: uiTheme.palette.common.white,
      },
    },

    SocialLinkContainerButtonContainer__icon: {
      width: '24px !important',
      height: 24,
    },

    SocialLinkContainerButtonContainer__xTwitterIcon: {
      fill: `${uiTheme.palette.neutral[400]} !important`,

      '&:hover': {
        fill: `${uiTheme.palette.common.white} !important`,
      },
    },
  }),
)
