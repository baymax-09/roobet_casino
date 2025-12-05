import React from 'react'
import { Typography, type TypographyProps, Switch } from '@mui/material'

import { useDarkMode } from 'admin/context'

import { useDarkModeToggleStyles } from './DarkModeToggle.styles'

interface DarkModeToggleProps {
  textVariant: TypographyProps['variant']
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  textVariant = 'h6',
}) => {
  const classes = useDarkModeToggleStyles()

  const [isDarkMode, setDarkMode] = useDarkMode()

  const handleThemeChange = event => {
    setDarkMode(event.target.checked)
  }

  return (
    <div className={classes.themeContainer}>
      <Typography variant={textVariant} className={classes.themeText}>
        {isDarkMode ? 'Dark' : 'Light'}
      </Typography>
      <Switch
        checked={isDarkMode}
        onChange={handleThemeChange}
        color="secondary"
        name="themeSwitch"
      />
    </div>
  )
}
