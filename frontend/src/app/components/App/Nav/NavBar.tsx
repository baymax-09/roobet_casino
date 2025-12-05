import React from 'react'
import clsx from 'clsx'
import { useMediaQuery } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks'
import { AppBar, Toolbar, IconButton, theme as uiTheme } from '@project-atl/ui'
import { Search, User } from '@project-atl/ui/assets'

import { env } from 'common/constants'
import { UIBalance } from 'mrooi'
import { useAppUpdate, useIsLoggedIn } from 'app/hooks'
import {
  MessagingMenuItem,
  RoowardsNavigation,
  NotificationIndicator,
} from 'app/components'
import logo from 'assets/images/logo.svg'
import logoHalloweenHorizontal from 'assets/images/logo-halloween-horizontal.svg'
import { useMessagingMenuItemStyles } from 'app/components/Messaging'
import { useApp, useNotificationsContext } from 'app/context'
import { sizing } from 'common/theme'

import { NavigationMenu } from './NavigationMenu'
import { LoginButtonsContainer } from './LoginButtonsContainer'

import { useNavBarStyles } from './NavBar.styles'

interface NavBarProps {
  chatHidden: boolean
  toggleSearchOpened: () => void
}

export const NavBar: React.FC<NavBarProps> = React.memo(
  ({ chatHidden, toggleSearchOpened }) => {
    const classes = useNavBarStyles()
    const { unreadMessages, hasMrRooMessages } = useNotificationsContext()
    const notificationClasses = useMessagingMenuItemStyles()
    const { sideNavigationOpen, appContainer } = useApp()
    const updateApp = useAppUpdate()

    const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))
    const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'))
    const isExtraLargeDesktop = useMediaQuery(() =>
      uiTheme.breakpoints.up('xl'),
    )

    const isLoggedIn = useIsLoggedIn()

    const popupState = usePopupState({
      variant: 'popover',
      popupId: 'profileMenu',
    })

    const [applyCSSTransition, setApplyCSSTransition] = React.useState(true)

    const scrollTop = React.useCallback(() => {
      // Close the menu on mobile if open
      if (!isTabletOrDesktop) {
        updateApp(app => {
          app.sideNavigationOpen = false
        })
      }
      if (window.location.pathname === '/') {
        appContainer?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
    }, [appContainer, isTabletOrDesktop])

    React.useEffect(() => {
      updateApp(app => {
        app.sideNavigationOpen = isDesktop
      })
    }, [isDesktop])

    // Don't allow transition effects when side navigation opens/closes.
    React.useEffect(() => {
      setApplyCSSTransition(false)
      setTimeout(() => {
        setApplyCSSTransition(true)
      }, 100)
    }, [sideNavigationOpen])

    const showNotifications = unreadMessages > 0

    const widthToRemove = React.useMemo(() => {
      const sideNavigationSize = sideNavigationOpen
        ? uiTheme.shape.sideNavigation.openWidth
        : uiTheme.shape.sideNavigation.closedWidth

      if (chatHidden) {
        return sideNavigationSize
      }

      const chatOpenWidth = isExtraLargeDesktop
        ? sizing.chat.width.xl
        : isDesktop
          ? sizing.chat.width.lg
          : 0
      return chatOpenWidth + sideNavigationSize
    }, [chatHidden, sideNavigationOpen, isExtraLargeDesktop, isDesktop])

    const desktopAppBarStyles = {
      left: sideNavigationOpen
        ? uiTheme.shape.sideNavigation.openWidth
        : uiTheme.shape.sideNavigation.closedWidth,
      width: `calc(100% - ${widthToRemove}px)`,
    }

    return (
      <>
        <AppBar
          className={clsx(classes.AppBar__root, {
            [classes.AppBar__root_borderRight]: !chatHidden && isDesktop,
            [classes.AppBar__root_transition]: applyCSSTransition,
          })}
          sx={[isTabletOrDesktop && desktopAppBarStyles]}
          component="div"
        >
          <Toolbar className={classes.AppBar__toolBar}>
            <div className={classes.ToolBar__contentLeft}>
              <RouterLink
                title="Go Home"
                className={clsx(classes.Logo, {
                  [classes.Logo_halloween]: env.SEASONAL === 'true',
                  // Show only Roobet coin portion of logo on medium viewport's, when chat or side nav open.
                  [classes.Logo_forceSmallLogo]:
                    isTabletOrDesktop &&
                    !isDesktop &&
                    (sideNavigationOpen || !chatHidden),
                })}
                to="/"
                onClick={scrollTop}
              >
                {env.SEASONAL === 'true' ? (
                  <img alt="logo" src={logoHalloweenHorizontal} />
                ) : (
                  <img alt="logo" src={logo} />
                )}
              </RouterLink>
            </div>

            {isLoggedIn && <UIBalance dark showDeposit />}
            <div className={classes.ToolBar__contentRight}>
              {isTabletOrDesktop && (
                <IconButton
                  disableRipple
                  {...bindTrigger(popupState)}
                  onClick={toggleSearchOpened}
                  color="tertiary"
                  borderOutline
                  size={isTabletOrDesktop ? 'medium' : 'small'}
                >
                  <Search width={16} height={16} />
                </IconButton>
              )}
              {isLoggedIn && (
                <>
                  <RoowardsNavigation />
                  {isTabletOrDesktop && <MessagingMenuItem />}
                  <IconButton
                    color="tertiary"
                    size={isTabletOrDesktop ? 'medium' : 'small'}
                    borderOutline
                    {...bindTrigger(popupState)}
                    disableRipple
                    {...(popupState.isOpen && {
                      sx: { backgroundColor: uiTheme.palette.neutral[600] },
                    })}
                  >
                    <User width={16} height={16} />
                    {!isTabletOrDesktop && showNotifications && (
                      <div
                        className={notificationClasses.NotificationContainer}
                      >
                        <NotificationIndicator
                          hasMrRooMessages={hasMrRooMessages}
                          unreadMessages={unreadMessages}
                        />
                      </div>
                    )}
                  </IconButton>
                </>
              )}
              {!isLoggedIn && <LoginButtonsContainer />}
              <NavigationMenu popupState={popupState} />
            </div>
          </Toolbar>
        </AppBar>
      </>
    )
  },
)
