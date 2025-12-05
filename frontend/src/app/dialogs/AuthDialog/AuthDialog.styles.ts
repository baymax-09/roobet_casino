import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface AuthDialogStyleProps {
  showPasswordText: boolean
}

const formStyles = theme =>
  createStyles({
    Form__inputFields: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
    },

    PasswordVisibilityButton: ({ showPasswordText }: AuthDialogStyleProps) => ({
      color: showPasswordText
        ? uiTheme.palette.primary[500]
        : uiTheme.palette.neutral[300],
      '&:hover': {
        color: uiTheme.palette.common.white,
      },
    }),

    button: {
      lineHeight: 'normal',
      fontWeight: theme.typography.fontWeightMedium,
      background: theme.palette.secondary.main,
      paddingLeft: 30,
      paddingRight: 30,
      color: '#9296c3',

      '&:hover': {
        background: 'rgba(0, 0, 0, 0.3)',
        color: '#fff',
      },
    },
  })

export const useAuthDialogStyles = makeStyles(theme =>
  createStyles({
    ...formStyles(theme),
    alert: {
      marginTop: theme.spacing(2),
      backgroundColor: 'rgba(255, 244, 229, 0.15)',
      color: '#e1e1e1',
    },

    Header: {
      color: uiTheme.palette.common.white,

      fontWeight: `${theme.typography.fontWeightBold} !important`,
      fontSize: '1.375rem !important',
      lineHeight: '1.75rem !important',
    },

    Subheader: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(0.5),
    },

    Subheader__title: {
      color: uiTheme.palette.common.white,

      fontWeight: `${theme.typography.fontWeightBold} !important`,
    },

    Subheader__link: {
      '&:hover': {
        color: uiTheme.palette.primary[25],
      },
    },

    Link: {
      '&:hover': {
        color: uiTheme.palette.common.white,
      },
    },

    CheckboxContainer: {
      margin: `${theme.spacing(1.5)} 0px`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    },

    CheckboxFormControl: {
      color: uiTheme.palette.neutral[400],
      marginLeft: '0px !important',
      marginRight: '0px !important',

      gap: theme.spacing(2),

      '&:hover #checkbox-border': {
        border: `2px solid ${uiTheme.palette.common.white}`,
      },

      '&:focus-within #checkbox-border': {
        border: `2px solid ${uiTheme.palette.common.white}`,
      },

      '& > span': {
        fontSize: '0.75rem',
        lineHeight: '1rem',
        margin: 0,
      },
    },
  }),
)
