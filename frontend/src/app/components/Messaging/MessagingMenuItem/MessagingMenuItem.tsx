import React from 'react'
import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks'
import {
  IconButton,
  Tab,
  Tabs,
  Popover,
  theme as uiTheme,
} from '@project-atl/ui'
import { Bell } from '@project-atl/ui/assets'

import { useTranslate } from 'app/hooks'
import { useNotificationsContext } from 'app/context'

import { UserMessagesList } from '../UserMessagesList'
import { NotificationIndicator } from '../NotificationIndicator'

import { useMessagingMenuItemStyles } from './MessagingMenuItem.styles'

export const getTabs = translate => ({
  all: {
    title: translate('messaging.userMessagesListTabAll'),
  },
  messages: {
    title: translate('messaging.userMessagesListTabMessages'),
    filter: item => item.__typename === 'Message',
  },
})

export const MessagingMenuItem = () => {
  const classes = useMessagingMenuItemStyles()
  const translate = useTranslate()

  const iconRef = React.useRef(null)

  const [currentTab, setCurrentTab] = React.useState('allNotifications')

  const tabs = React.useMemo(
    () => [
      {
        key: 'allNotifications',
        label: translate('messaging.userMessagesListTabAll'),
      },
      {
        key: 'fromRoobet',
        label: translate('messaging.userMessagesListTabMessages'),
        customFilter: item => item.__typename === 'Message',
      },
    ],
    [translate],
  )

  const { unreadMessages, hasMrRooMessages } = useNotificationsContext()

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'messagesPopover',
  })

  const showNotifications = unreadMessages > 0

  return (
    <>
      <IconButton
        sx={{ position: 'relative' }}
        size="medium"
        color="tertiary"
        borderOutline={true}
        ref={iconRef}
        disableRipple
        {...bindTrigger(popupState)}
        {...(popupState.isOpen && {
          sx: { backgroundColor: uiTheme.palette.neutral[600] },
        })}
      >
        <Bell width={16} heigh={16} />
        {showNotifications && (
          <div className={classes.NotificationContainer}>
            <NotificationIndicator
              hasMrRooMessages={hasMrRooMessages}
              unreadMessages={unreadMessages}
            />
          </div>
        )}
      </IconButton>
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
        slotProps={{ paper: { className: classes.MessageMenu } }}
      >
        <div className={classes.UserMessageListContainer}>
          <Tabs
            color="secondary"
            variant="fullWidth"
            value={currentTab}
            onChange={(_, newTab) => setCurrentTab(newTab)}
          >
            {Object.entries(tabs).map(([_, { key, label }]) => (
              <Tab key={key} value={key} label={label} />
            ))}
          </Tabs>
          <UserMessagesList
            popupState={popupState}
            tabs={tabs}
            currentTab={currentTab}
          />
        </div>
      </Popover>
    </>
  )
}
