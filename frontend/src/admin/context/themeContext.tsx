import React, { createContext, useContext } from 'react'
import { useMediaQuery } from '@mui/material'
import { useLocalStorage } from 'react-use'

const DARK_MODE_LS_KEY = 'roobet-dark-mode'

interface ThemeContext {
  darkMode: boolean
  setDarkMode: (val: boolean) => void
}

type ThemeContextProviderProps = React.PropsWithChildren<Record<never, never>>

const themeContext = createContext<ThemeContext | undefined>(undefined)

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({
  children,
}) => {
  const darkModeMediaQuery = useMediaQuery('(prefers-color-scheme: dark)', {
    noSsr: true,
  })
  const [darkMode, setDarkMode] = useLocalStorage(
    DARK_MODE_LS_KEY,
    darkModeMediaQuery,
  )
  const defaultValues = {
    darkMode,
    setDarkMode,
  }
  return (
    <themeContext.Provider value={defaultValues}>
      {children}
    </themeContext.Provider>
  )
}

export const useDarkMode = (): [boolean, (boolean) => void] => {
  const context = useContext(themeContext)
  if (!context) {
    throw new Error('ThemeContextConsumer requires a provider')
  }
  return [context.darkMode, context.setDarkMode]
}

export const ThemeContextConsumer = themeContext.Consumer
