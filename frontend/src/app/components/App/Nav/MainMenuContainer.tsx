import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { MainMenu } from './MainMenu'

export const useMainMenuContainerStyles = makeStyles(theme =>
  createStyles({
    MenuContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: uiTheme.palette.neutral[900],
      zIndex: 10,
      padding: theme.spacing(2),
      overflow: 'auto',
      overscrollBehavior: 'contain',
    },

    MenuContent: {
      borderRadius: '12px',
      padding: theme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
    },
  }),
)

export const MainMenuContainer: React.FC = () => {
  const classes = useMainMenuContainerStyles()

  return (
    <div className={classes.MenuContainer}>
      <div className={classes.MenuContent}>
        <MainMenu />
      </div>
    </div>
  )
}
