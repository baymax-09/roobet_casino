import { type Theme, createTheme } from '@mui/material'

import {
  lightTheme as lightCommonTheme,
  baseTypography,
  adaptV4,
  type DeprecatedAppTheme,
} from 'common/theme'

const darkModeBackground = '#2e2a57'

const addColorToTypography = (isDarkMode: boolean) => {
  const currentTypography = baseTypography!
  Object.keys(baseTypography!).forEach(key => {
    currentTypography[key] = {
      ...currentTypography[key],
      color: isDarkMode
        ? lightCommonTheme.palette.secondary.main
        : lightCommonTheme.palette.common.black,
    }
  })
  return currentTypography
}

const lightThemePalette = {
  ...lightCommonTheme.palette,

  primary: {
    main: '#1d2630',
  },
}

export const lightTheme = createTheme(
  adaptV4({
    ...lightCommonTheme,
    typography: addColorToTypography(false),

    palette: lightThemePalette,

    overrides: {
      MUIDataTableToolbar: {
        filterPaper: {
          // Full width of page, minus auto left-hand spacing.
          minWidth: `calc(100% - ${lightCommonTheme.spacing(4)})`,

          // Desktop size, float but keep reasonable width.
          [lightCommonTheme.breakpoints.up('md')]: {
            minWidth: 750,
          },
        },

        root: {
          flexShrink: 0,
        },

        filterCloseIcon: {
          top: '12px !important',
          right: '12px !important',
        },

        left: {
          '& h6': {
            fontWeight: 500,
            fontSize: 24,
            lineHeight: '24px',
            color: '#3a5065',
          },
        },
      },

      MUIDataTableFilter: {
        root: {
          padding: lightCommonTheme.spacing(3),

          // There is probably a better way to do this, but lord knows how.
          '& .MuiFormLabel-root:not([data-shrink])': {
            fontSize: '13px',
          },
        },

        title: {
          fontSize: '1.3em',
        },
      },

      MUIDataTable: {
        tableRoot: {
          padding: '0 16px',

          '& tbody tr:last-child .MuiTableCell-root': {
            borderColor: 'transparent',
          },
        },

        responsiveBase: {
          flex: 1,
        },
      },

      MUIDataTableFooter: {
        root: {
          color: '#415365',
          flexShrink: 0,
          boxShadow: '0px -1px 9px rgb(0 0 0 / 20%)',
        },
      },

      MuiTablePagination: {
        root: {
          color: '#415365',
        },

        caption: {
          fontWeight: 500,
        },
      },

      MUIDataTableToolbarSelect: {
        root: {
          flex: 'none',
        },
      },

      MuiPaper: {
        root: {
          border: '1px solid rgb(0 0 0 / 0.06)',
        },
      },

      MuiTab: {
        root: {
          textTransform: 'none',
        },
      },

      MuiButton: {
        root: {
          textTransform: 'none',
        },
      },
    },
  }),
)

const darkThemePalette = {
  // @ts-expect-error TODO AFTER MUI5-UPGRADE merge theme.
  gray: lightCommonTheme.palette.gray,
  mode: 'dark',
  // @ts-expect-error TODO AFTER MUI5-UPGRADE merge theme.
  green: lightCommonTheme.palette.green,
  // @ts-expect-error TODO AFTER MUI5-UPGRADE merge theme.
  red: lightCommonTheme.palette.red,
  primary: {
    main: '#7049c4',
  },
  secondary: {
    main: lightCommonTheme.palette.secondary.main,
  },
  background: {
    paper: '#424242',
    default: '#303030',
  },
}

export const darkTheme = createTheme(
  adaptV4({
    ...lightCommonTheme,
    typography: addColorToTypography(true),
    palette: darkThemePalette,

    overrides: {
      MUIDataTableToolbar: {
        filterPaper: {
          // Full width of page, minus auto left-hand spacing.
          minWidth: `calc(100% - ${lightCommonTheme.spacing(4)})`,

          // Desktop size, float but keep reasonable width.
          [lightCommonTheme.breakpoints.up('md')]: {
            minWidth: 750,
          },
        },

        root: {
          flexShrink: 0,
        },

        filterCloseIcon: {
          top: '12px !important',
          right: '12px !important',
        },

        left: {
          '& h6': {
            fontWeight: 500,
            fontSize: 24,
            lineHeight: '24px',
          },
        },
      },

      MUIDataTableFilter: {
        root: {
          padding: lightCommonTheme.spacing(3),

          // There is probably a better way to do this, but lord knows how.
          '& .MuiFormLabel-root:not([data-shrink])': {
            fontSize: '13px',
          },
        },

        title: {
          fontSize: '1.3em',
        },
      },

      MUIDataTable: {
        backgroundColor: darkModeBackground,
        tableRoot: {
          padding: '0 16px',

          '& tbody tr:last-child .MuiTableCell-root': {
            borderColor: 'transparent',
          },
        },

        responsiveBase: {
          flex: 1,
        },
      },

      MUIDataTableFooter: {
        root: {
          // color: '#415365',
          flexShrink: 0,
          boxShadow: '0px -1px 9px rgb(0 0 0 / 20%)',
        },
      },

      MuiTablePagination: {
        // root: {
        //   color: '#415365',
        // },

        caption: {
          fontWeight: 500,
        },
      },

      MUIDataTableToolbarSelect: {
        root: {
          flex: 'none',
        },
      },

      MuiPaper: {
        root: {
          border: '1px solid rgb(0 0 0 / 0.06)',
        },
      },

      MuiTab: {
        root: {
          textTransform: 'none',
        },
      },

      MuiButton: {
        root: {
          textTransform: 'none',
          color: '#fff',
        },
      },
    },
  }),
)

type DeprecatedTheme = DeprecatedAppTheme & {
  palette: typeof lightThemePalette
} & { palette: typeof darkThemePalette } & Theme

/**
 * This override is required to merge the old theme tokens with the new one.
 * The DefaultTheme type gets picked up be the makeStyles and createStyles API.
 * To be removed when @mui/styles/createStyles and @mui/styles/makeStyles is removed.
 */
declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends DeprecatedTheme {}
}
