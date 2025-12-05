import {
  lighten,
  darken,
  createTheme,
  type DeprecatedThemeOptions,
  adaptV4Theme,
} from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'
import { type ThemeOptions } from '@mui/material/styles'
import { type DeepPartial } from 'ts-essentials'

import { env } from 'common/constants'

/**
 * Just wrapping the adaptV4Theme, probably it's returning the wrong typing
 * Docs looks right https://v5-0-6.mui.com/guides/migration-v4/#theme-structure. But
 * adaptV4Theme needs to return ThemeOptions to fit into createTheme.
 *
 * @deprecated
 */
export const adaptV4 = (theme: any) =>
  adaptV4Theme(theme) as unknown as ThemeOptions

export type CommonTheme = typeof theme

const primaryColor = '#2f3258'
const red = '#f44336'

// This is used for the product only, it needs to be moved with the rest.
export const sizing = {
  chat: {
    width: {
      xl: 380,
      lg: 350,
    },
  },

  header: {
    height: {
      desktop: 94,
      mobile: 56,
    },
  },
}

const baseThemeStyles = {
  palette: {
    green: {
      main: '#60af5a',
      light: lighten('#60af5a', 0.15), // #77bb72
      lighter: lighten('#60af5a', 0.35), // #97cb93
      dark: darken('#60af5a', 0.15), // #51944c
      darker: darken('#60af5a', 0.35), // #3e713a
    },

    red: {
      main: red,
      light: lighten(red, 0.2), // #f6685e
      dark: darken(red, 0.05),
    },

    // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
    gray: {
      light: '#e0e0e0',
      lighter: '#e4e4e4',
      dark: '#5a5a5a',
      darker: '#1E2021',
    },

    purple: {
      main: '#3F51B5',
    },

    orange: {
      main: '#ff7421',
      dark: darken('#ff7421', 0.05),
    },

    blue: {
      main: '#0075d0',
      light: '#EAF4FC',
      dark: darken('#0075d0', 0.05),
      darker: '#1C3B5E',
    },
  },

  breakpoints: {
    // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1100, // these are the MUI defaults except large which is normally 1200
      xl: 1536,
    },
  },

  typography: {
    // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
    useNextVariants: true, // don't think we need this but id want to test more to confirm
  },

  shape: {
    borderRadius: 4,
  },

  overrides: {
    MuiButton: {
      // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
      label: {
        textTransform: 'none',
        letterSpacing: 0,
      },

      root: {
        '&.Mui-disabled': {
          cursor: 'not-allowed',
          color: 'rgba(0, 0, 0, 0.26)',
        },
      },

      containedPrimary: {
        color: '#fff',
      },
    },

    MuiPaper: {
      root: {
        color: 'rgba(0, 0, 0, 0.8)',
      },
    },

    MuiListItem: {
      root: {
        '&.Mui-selected, &.Mui-selected:hover': {
          background: 'rgba(0, 0, 0, 0.14) !important',
        },
      },
    },

    MuiDialogContent: {
      root: {
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.12)', // #dedede
      },
    },

    MuiSkeleton: {
      root: {
        borderRadius: 4,
      },
    },

    MuiFormHelperText: {
      root: {
        color: 'rgba(0, 0, 0, 0.7)',

        '&.Mui-disabled': {
          color: 'rgba(0, 0, 0, 0.3)',
        },
      },
    },

    MuiAccordionActions: {
      root: {
        position: 'relative',
        overflow: 'hidden',
      },
    },

    MuiDialog: {
      paper: {
        borderRadius: 6,
        overflow: 'hidden',
      },
    },

    MuiAlertTitle: {
      root: {
        marginBottom: 0,
      },
    },
  },
} satisfies DeprecatedThemeOptions

export const baseTypography: Partial<ThemeOptions['typography']> = {
  h1: {
    fontSize: '1.75rem',
    fontWeight: 600,
  },
  h2: {
    fontSize: '1.655rem',
    fontWeight: 500,
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 500,
  },
  h4: {
    fontSize: '1.3rem',
    fontWeight: 500,
  },
  h5: {
    fontSize: '1.225rem',
    fontWeight: 500,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 400,
  },
  fontWeightBold: 700,
}

// seasonal Theme
const Halloween: DeepPartial<ThemeOptions> = {
  palette: {
    primary: {},
    secondary: {
      main: '#e6674b',
      dark: darken('#e6674b', 0.25),
      contrastText: '#3d3d3d',
      // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
      dialogBackground: 'rgba(0, 0, 0, 0.8)', // TODO this does not belong here
      '&:hover': {
        backgroundColor: darken('#e6674b', 0.25),
      },
    },
  },
}
// Seasonal Palette
const seasonalTheme = env.SEASONAL === 'true' ? Halloween : {}

const appThemeStyles = {
  ...baseThemeStyles,
  ...seasonalTheme,

  // @ts-expect-error TODO AFTER MUI5-UPGRADE get rid of the old theme
  typography: baseTypography,

  palette: {
    ...baseThemeStyles.palette,

    /**
     * @deprecated Use theme colors from UI.
     */
    deprecated: {
      textPrimary: '#fff',
      text: {
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      primary: {
        // TODO AFTER MUI5-UPGRADE: probably an old color deprecated.primary.dark
        dark: darken(primaryColor, 0.25), // #232542
        main: primaryColor,
      },
    },

    primary: {
      // Is overwritten by UI.
      // dark: darken(primaryColor, 0.25), // #232542
      main: primaryColor,
      darker: '#232645',
      light: lighten(primaryColor, 0.25), // #636581
      contrastText: '#fff',
      // @ts-expect-error TODO @deprecated AFTER MUI5-UPGRADE merge the theme somehow
      dialogBackground: '#fff', // TODO this does not belong here
    },

    secondary: {
      main: '#e6be4b',
      dark: darken('#e6be4b', 0.25),
      contrastText: '#3d3d3d',
      // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
      dialogBackground: 'rgba(0, 0, 0, 0.8)', // TODO this does not belong here
      '&:hover': {
        backgroundColor: darken('#e6be4b', 0.25),
      },
      ...(seasonalTheme?.palette?.secondary ?? {}),
    },

    action: {
      selected: 'rgba(255, 255, 255, 0.14)',
      disabled: 'rgba(255, 255, 255, 0.26)',
    },

    text: {
      primary: 'rgba(255, 255, 255)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      // @ts-expect-error TODO AFTER MUI5-UPGRADE merge the theme somehow
      hint: 'rgba(255, 255, 255, 0.3)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },

    background: {
      default: '#2e2a57',
    },
  },

  overrides: {
    ...baseThemeStyles.overrides,

    MuiSnackbarContent: {
      root: {
        color: 'white',
        backgroundColor: darken(primaryColor, 0.25),
        borderRadius: 4,
      },
    },

    MuiMenu: {
      paper: {
        backgroundColor: '#423C7A',
        color: '#fff',

        '& [class*="MuiListItem-button"]:hover': {
          background: 'rgba(255,255,255,0.1)',
        },

        '& [class*="MuiListItemText-primary"]': {
          fontWeight: '500',
          fontSize: '0.875rem',
        },

        '& [class*="MuiListItemIcon-root"]': {
          fontSize: 18,
          fontWeight: '400',
          color: '#b4baff !important',
          marginRight: '8px',
          minWidth: 'auto !important',
        },
      },
    },
  },
} satisfies DeprecatedThemeOptions

export interface DeprecatedAppTheme {
  palette: typeof appThemeStyles.palette
}

export const theme = createTheme(adaptV4(appThemeStyles), uiTheme)

export const confirmDialogTheme = createTheme(
  adaptV4({
    ...baseThemeStyles,

    palette: {
      ...baseThemeStyles.palette,
      primary: {
        main: '#ffffff',
      },
      secondary: theme.palette.secondary,
      text: {},
      action: {},
    },

    overrides: {
      ...baseThemeStyles.overrides,

      MuiDialog: {
        paper: {
          background: primaryColor,
        },
      },

      MuiDialogTitle: {
        root: {
          color: '#fff',
        },
      },

      MuiDialogContent: {
        dividers: {
          borderTop: 'none',
          borderBottom: 'none',
        },

        root: {
          background: 'rgb(0, 0, 0, 0.25)',
        },
      },

      MuiDialogContentText: {
        root: {
          marginBottom: 0,
          color: 'rgb(255, 255, 255, 0.54)',
        },
      },
    },
  }),
  uiTheme,
)

/** @todo: this theme is used by the ACP and dialogs.context.tsx, this should be split */
export const lightTheme = createTheme(
  adaptV4({
    ...baseThemeStyles,

    palette: {
      ...baseThemeStyles.palette,
      primary: theme.palette.primary,
      secondary: theme.palette.secondary,
      text: {},
      action: {},
    },

    overrides: {
      ...baseThemeStyles.overrides,

      MuiSwitch: {
        root: {
          '& + span': {
            ...theme.typography.body2,
          },
        },
      },
    },
  }),
  uiTheme,
)
