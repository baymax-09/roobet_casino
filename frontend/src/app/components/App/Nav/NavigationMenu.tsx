import React from 'react'
import { useMediaQuery } from '@mui/material'
import { bindPopover } from 'material-ui-popup-state/hooks'
import { useSelector } from 'react-redux'
import { useIntercom } from 'react-use-intercom'
import {
  IconCategoryItem,
  IconMenuList,
  Typography,
  theme as uiTheme,
  Popover,
} from '@project-atl/ui'
import {
  HelpCenter,
  History,
  Logout,
  AccountSettings,
  Support,
  Profile,
  Cashier,
  ReferAndEarn,
  Bell,
} from '@project-atl/ui/assets'
import { useHistory } from 'react-router-dom'

import { store, intercomProps } from 'app/util'
import { endSession } from 'app/lib/user'
import { defaultSocket } from 'app/lib/sockets'
import {
  useAppUpdate,
  useDialogsOpener,
  useIsLoggedIn,
  useTranslate,
} from 'app/hooks'
import { NotificationIndicator } from 'app/components/Messaging'
import { useApp, useNotificationsContext } from 'app/context'
import { ACCOUNT_SETTINGS_GENERAL_LINK } from 'app/routes/AccountSettingsRoute/constants/accountSettingsLinks'

import { useNavigationMenuStyles } from './NavigationMenu.styles'

interface NavigationMenuProps {
  popupState: any
}

export const NavigationMenu: React.FC<NavigationMenuProps> = React.memo(
  ({ popupState }) => {
    const classes = useNavigationMenuStyles()
    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      { noSsr: true },
    )
    const { show, update, shutdown } = useIntercom()
    const translate = useTranslate()
    const openDialog = useDialogsOpener()
    const history = useHistory()
    const updateApp = useAppUpdate()
    const { sideNavigationOpen } = useApp()

    const { unreadMessages, hasMrRooMessages } = useNotificationsContext()

    const isLoggedIn = useIsLoggedIn()
    const name = useSelector(({ user }) => user?.name ?? null)
    // const isPromoBanned = useSelector(
    //   ({ user }) => user?.isPromoBanned,
    // )

    const togglePopupDialog = (dialogName, params = {}) => {
      popupState.close()
      openDialog(dialogName, params)
    }

    const onLiveSupport = React.useCallback(() => {
      popupState.close()
      if (isLoggedIn) {
        const state = store.getState()
        update(intercomProps(state.user))
        show()
      }
    }, [isLoggedIn, popupState, update, show])

    const userItems = [
      {
        key: 'cashier',
        icon: Cashier,
        text: translate('navMenu.cashier'),
        buttonProps: {
          onClick: () => togglePopupDialog('cashier'),
        },
      },
      // ...(isPromoBanned
      //   ? []
      //   : [
      //       {
      //         key: 'freePlay',
      //         icon: FreePlay,
      //         text: translate('navMenu.freePlay'),
      //         buttonProps: {
      //           onClick: () => togglePopupDialog('freePlay'),
      //         },
      //       },
      //     ]),
      {
        key: 'account',
        icon: AccountSettings,
        text: translate('navMenu.accountSettings'),
        buttonProps: {
          onClick: () => {
            popupState.close()
            history.push(ACCOUNT_SETTINGS_GENERAL_LINK)
            // Close the "Menu" on  mobile when opening "Account Settings"
            if (!isTabletOrDesktop && sideNavigationOpen) {
              updateApp(app => {
                app.sideNavigationOpen = false
              })
            }
          },
        },
      },
      {
        key: 'profile',
        icon: Profile,
        text: translate('navMenu.profile'),
        buttonProps: {
          onClick: () =>
            togglePopupDialog('profile', {
              params: {
                user: name,
              },
            }),
        },
      },
      {
        key: 'history',
        icon: History,
        text: translate('navMenu.history'),
        buttonProps: {
          onClick: () => togglePopupDialog('history'),
        },
      },
      {
        key: 'referAndEarn',
        icon: ReferAndEarn,
        text: translate('navMenu.referAndEarn'),
        buttonProps: {
          onClick: () => togglePopupDialog('affiliate'),
        },
      },
      // ...(isPromoBanned
      //   ? []
      //   : [
      //       {
      //         key: 'roowards',
      //         icon: FreePlay,
      //         text: translate('navMenu.roowards'),
      //         buttonProps: {
      //           onClick: () => togglePopupDialog('roowards'),
      //         },
      //       },
      //     ]),
    ]

    const supportItems = [
      {
        key: 'helpCenter',
        icon: HelpCenter,
        text: translate('navMenu.helpCenter'),
        buttonProps: {
          onClick: () => window.open('https://help.roobet.com', '_blank'),
        },
      },
      {
        key: 'liveSupport',
        icon: Support,
        text: translate('navMenu.liveSupport'),
        buttonProps: {
          onClick: onLiveSupport,
        },
      },
    ]

    const showNotifications = unreadMessages > 0

    return (
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{ paper: { className: classes.NavigationMenuPopover } }}
      >
        <div className={classes.NavigationMenu}>
          <div>
            <Typography
              component="span"
              variant="body4"
              color={uiTheme.palette.neutral[300]}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {translate('navMenu.hey')}{' '}
              <span className={classes.Username}>{name}</span>
            </Typography>
          </div>
          {!isTabletOrDesktop && (
            <IconCategoryItem
              sx={{ height: 36 }}
              text={translate('navMenu.notifications')}
              icon={Bell}
              iconProps={{
                iconFill: uiTheme.palette.neutral[400],
                width: 20,
                height: 20,
              }}
              typographyProps={{
                variant: 'body4',
                fontWeight: uiTheme.typography.fontWeightMedium,
                color: uiTheme.palette.neutral[200],
              }}
              onClick={() => togglePopupDialog('notifications')}
            >
              {showNotifications && (
                <div className={classes.NotificationIndicatorContainer}>
                  <NotificationIndicator
                    hasMrRooMessages={hasMrRooMessages}
                    unreadMessages={unreadMessages}
                  />
                </div>
              )}
            </IconCategoryItem>
          )}
          <IconMenuList items={userItems} />
          <IconMenuList items={supportItems} />
          <IconCategoryItem
            text={translate('navMenu.logout')}
            icon={Logout}
            onClick={() => {
              shutdown()
              defaultSocket._socket.connect()
              popupState.close()
              endSession()
            }}
            iconProps={{ iconFill: uiTheme.palette.neutral[400] }}
            typographyProps={{
              variant: 'body4',
              fontWeight: uiTheme.typography.fontWeightMedium,
              color: uiTheme.palette.neutral[200],
            }}
          />
        </div>
      </Popover>
    )
  },
)
