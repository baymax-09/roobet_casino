import { Tabs, Tab } from '@mui/material'
import React, { type Dispatch, type SetStateAction } from 'react'

import { tabs, type TabName } from '../MessageTabs'
import { useMailboxStyles } from '../MessageList/MessageList.styles'

interface MessageTabsProps {
  tab: string
  setTab: Dispatch<SetStateAction<TabName>>
}

const MessageTabs: React.FC<MessageTabsProps> = (tab, setTab) => {
  const classes = useMailboxStyles()

  return (
    <Tabs
      className={classes.tabs}
      indicatorColor="primary"
      value={tab}
      onChange={(_, newTabKey: TabName) => {
        setTab(newTabKey)
      }}
    >
      {Object.entries(tabs).map(([key, tab]) => (
        <Tab
          key={key}
          value={key}
          label={tab.label}
          onClick={() => setTab(key as TabName)}
        />
      ))}
    </Tabs>
  )
}

export default MessageTabs
