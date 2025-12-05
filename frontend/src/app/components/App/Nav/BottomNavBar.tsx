import React from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  theme as uiTheme,
} from '@project-atl/ui'
import {
  Search,
  Chat as ChatIcon,
  MenuIcon,
  CasinoMobile,
  SportsbookMobile,
} from '@project-atl/ui/assets'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { useLocation, useHistory } from 'react-router-dom'

import { useAppUpdate, useDialogsClose, useTranslate } from 'app/hooks'
import { CASINO_LOBBY_LINK } from 'app/routes/CasinoPageRoute'
import { useApp } from 'app/context'

interface BottomNavBarProps {
  chatHidden: boolean
  searchOpened: boolean
  toggleChatHidden: (nextValue?: boolean) => void
  toggleSearchOpened: (nextValue?: boolean) => void
}

export const useBottomNavBarStyles = makeStyles(theme =>
  createStyles({
    App__bottomNavigation: {
      position: 'fixed',
      right: 0,
      left: 0,
      bottom: 0,
      zIndex: 2,
    },
  }),
)

const getValueState = ({
  chatHidden,
  searchOpened,
  sideNavigationOpen,
  casinoActive,
  sportsbookActive,
}) => {
  if (!chatHidden) {
    return 'chat'
  }
  if (searchOpened) {
    return 'search'
  }
  if (sideNavigationOpen) {
    return 'menu'
  }
  if (casinoActive) {
    return 'casino'
  }
  if (sportsbookActive) {
    return 'sports'
  }
  return undefined
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  chatHidden,
  searchOpened,
  toggleChatHidden,
  toggleSearchOpened,
}) => {
  const classes = useBottomNavBarStyles()
  const translate = useTranslate()
  const location = useLocation()
  const history = useHistory()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const { sideNavigationOpen } = useApp()
  const closeDialog = useDialogsClose()
  const updateApp = useAppUpdate()

  const sportsbookActive = location.pathname === '/sports'
  const casinoActive = location.pathname === CASINO_LOBBY_LINK

  // React on navigation change.
  const handleBottomNavigationChange = React.useCallback(
    (_, newValue) => {
      // Close any dialogs if they are open
      closeDialog()

      if (newValue === 'search') {
        toggleSearchOpened()
      } else {
        toggleSearchOpened(false)
      }

      if (newValue === 'casino') {
        history.push(CASINO_LOBBY_LINK)
      }

      if (newValue === 'sports') {
        history.push('/sports')
      }

      if (newValue === 'chat') {
        toggleChatHidden()
      } else {
        toggleChatHidden(true)
      }

      // Hiding and toggling the menu
      updateApp(app => {
        app.sideNavigationOpen =
          newValue !== 'menu' ? false : !sideNavigationOpen
      })
    },
    [
      closeDialog,
      sideNavigationOpen,
      updateApp,
      toggleSearchOpened,
      history,
      toggleChatHidden,
    ],
  )

  // Derive the value of the BottomNavigation
  const value = getValueState({
    chatHidden,
    searchOpened,
    sideNavigationOpen,
    casinoActive,
    sportsbookActive,
  })

  if (isTabletOrDesktop) {
    return null
  }

  return (
    <div className={classes.App__bottomNavigation}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={handleBottomNavigationChange}
      >
        <BottomNavigationAction
          value="menu"
          label={translate('bottomNavigation.menu')}
          icon={<MenuIcon />}
        />
        <BottomNavigationAction
          value="search"
          label={translate('bottomNavigation.search')}
          icon={<Search />}
        />
        <BottomNavigationAction
          value="casino"
          label={translate('bottomNavigation.casino')}
          icon={<CasinoMobile />}
        />
        <BottomNavigationAction
          value="sports"
          label={translate('bottomNavigation.sports')}
          icon={<SportsbookMobile />}
        />
        <BottomNavigationAction
          value="chat"
          label={translate('bottomNavigation.chat')}
          icon={<ChatIcon />}
        />
      </BottomNavigation>
    </div>
  )
}
