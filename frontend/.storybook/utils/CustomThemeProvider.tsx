import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'
import { StoryContext } from '@storybook/react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

import { theme as app } from 'common/theme'
import {
  lightTheme as ACPLightMode,
  darkTheme as ACPDarkMode,
} from 'admin/theme'

const themeMap = {
  app,
  ACPDarkMode,
  ACPLightMode,
}

export const CustomThemeProvider: React.FC<
  React.PropsWithChildren<{ context: StoryContext }>
> = ({ context, children }) => {
  // Get values from story parameter first, else fallback to globals
  const theme = context.parameters.theme || context.globals.theme

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={themeMap[theme]}>{children}</ThemeProvider>
      </StyledEngineProvider>
    </LocalizationProvider>
  )
}
