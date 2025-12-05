import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { useDialogsClose, useIsLoggedIn, useTranslate } from 'app/hooks'
import { UserMessagesList } from 'app/components/Messaging'
import { type DialogProps } from 'app/types'
import { LoginOverlay } from 'mrooi'

import { DialogWithTabs } from '../DialogWithTabs'

interface NotificationsDialogProps {
  DialogProps: DialogProps
  params: {
    tab: string
  }
}

const _tabs = [
  {
    key: 'allNotifications',
    // t('messaging.userMessagesListTabAll')
    label: 'messaging.userMessagesListTabAll',
  },
  {
    key: 'fromRoobet',
    // t('messaging.userMessagesListTabMessages')
    label: 'messaging.userMessagesListTabMessages',
    customFilter: item => item.__typename === 'Message',
  },
]

const isValidTab = (key: string) => _tabs.some(tab => tab.key === key)

export const useNotificationsDialogStyles = makeStyles(theme =>
  createStyles({
    UserMessageListContainer: {
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(1.5),
      backgroundColor: uiTheme.palette.neutral[700],
      borderRadius: 12,
    },
  }),
)

export const NotificationsDialog: React.FC<NotificationsDialogProps> =
  React.memo(({ DialogProps, params }) => {
    const classes = useNotificationsDialogStyles()
    const translate = useTranslate()
    const closeDialog = useDialogsClose()
    const isLoggedIn = useIsLoggedIn()

    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )

    const [tab, setTab] = React.useState(() => {
      const defaultTab = isValidTab(params.tab) ? params.tab : _tabs[0].key
      return _tabs.findIndex(tab => tab.key === defaultTab) || 0
    })

    const activeTab = _tabs[tab]

    // Dialog is only shown on mobile
    React.useEffect(() => {
      if (isTabletOrDesktop) {
        closeDialog()
      }
    }, [isTabletOrDesktop])

    return (
      <DialogWithTabs
        helmetTitle={`${translate('navMenu.notifications')} - ${translate(
          activeTab.label,
        )}`}
        tabs={_tabs}
        currentTab={tab}
        setCurrentTab={setTab}
        title={translate('navMenu.notifications')}
        maxWidth="md"
        {...DialogProps}
      >
        {!isLoggedIn && <LoginOverlay dialog="notifications" params={params} />}
        <div className={classes.UserMessageListContainer}>
          <UserMessagesList tabs={_tabs} currentTab={activeTab.key} />
        </div>
      </DialogWithTabs>
    )
  })
