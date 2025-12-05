import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFooterCategoryColumnStyles = makeStyles(theme =>
  createStyles({
    FooterCategoryColumnTitleContainer: {
      display: 'flex',
      marginBottom: uiTheme.spacing(1),
    },

    FooterCategoryColumnTitleContainer__icon: {
      marginLeft: 'auto',
    },

    FooterCategoryColumnList: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
    },

    FooterCategoryColumnList_mobile: {
      marginLeft: theme.spacing(2),
      display: 'flex',
    },

    FooterCategoryColumnListItem: {
      ...theme.typography.body1,
      display: 'block',
      borderRadius: 0,
      padding: 0,
      marginRight: theme.spacing(2),
      color: uiTheme.palette.neutral[400],
      cursor: 'pointer',
      width: 'fit-content',

      '&:last-of-type': {
        marginRight: 0,
      },

      '&:hover': {
        background: 'none',
        color: uiTheme.palette.common.white,
      },
    },

    FooterCategoryColumnListItem__text: {
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }),
)
