import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useMutation, useLazyQuery, type ApolloError } from '@apollo/client'
import MUIDataTable, { type MUIDataTableOptions } from 'mui-datatables'
import { Button, Tab, Tabs } from '@mui/material'

import { Loading, TitleContainer } from 'mrooi'
import {
  MessagesQuery,
  MessageDeleteMutation,
  MessageRestoreMutation,
} from 'admin/gql'
import { type Message } from 'common/types/message'
import { useToasts } from 'common/hooks'

import { tabs } from '../MessageTabs'

import { useMailboxStyles } from './MessageList.styles'

const LIST_TABS = ['Drafts', 'Sent', 'Deleted'] as const
type TabName = (typeof LIST_TABS)[number]

const TAB_ACTIONS_SWITCH = (
  id,
  tableViewTab,
  deleteDraft,
  unsendMessage,
  restoreDraft,
  classes,
  history,
) => {
  const handleClick = () => {
    switch (tableViewTab) {
      case 'Drafts':
        return deleteDraft({ variables: { data: { id } } })
      case 'Sent':
        return unsendMessage({ variables: { data: { id } } })
      case 'Deleted':
        return restoreDraft({ variables: { data: { id } } })
      default:
        return null
    }
  }

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        size="small"
        className={classes.ListMessagesActions_addMargin}
        onClick={handleClick}
      >
        {tableViewTab === 'Drafts' && 'Delete'}
        {tableViewTab === 'Sent' && 'Unsend'}
        {tableViewTab === 'Deleted' && 'Recover'}
      </Button>
      {tableViewTab === 'Drafts' && (
        <Button
          className={classes.ListMessagesActions_addMargin}
          variant="contained"
          color="primary"
          size="small"
          onClick={() => history.push(`/messaging/mailbox/${id}/edit`)}
        >
          Edit
        </Button>
      )}
    </>
  )
}

export const MessageList: React.FC = () => {
  const classes = useMailboxStyles()
  const history = useHistory()
  const { toast } = useToasts()

  const onError: (error: ApolloError) => void = ({ message }) => {
    toast.error(message)
  }

  const [tableViewTab, setTableViewTab] = useState<TabName>('Drafts')

  const queryVariables = useMemo(() => {
    if (tableViewTab === 'Drafts') {
      return {
        live: false,
        deleted: false,
      }
    }
    if (tableViewTab === 'Sent') {
      return {
        live: true,
        deleted: false,
      }
    }
    if (tableViewTab === 'Deleted') {
      return {
        live: false,
        deleted: true,
      }
    }
  }, [tableViewTab])

  const [getMessages, { data, loading }] = useLazyQuery<{
    messages: Message[]
  }>(MessagesQuery, {
    variables: queryVariables,
    onError,
  })

  // deleteDraft
  const [deleteDraft] = useMutation(MessageDeleteMutation, {
    onError,
    onCompleted: () => {
      toast.success('Message draft deleted.')
      getMessages()
    },
  })

  // restoreDraft
  const [restoreDraft] = useMutation(MessageRestoreMutation, {
    onError,
    onCompleted: () => {
      toast.success('Message draft restored.')
      getMessages()
    },
  })

  // un-send message
  const [unsendMessage] = useMutation(MessageDeleteMutation, {
    onError,
    onCompleted: () => {
      toast.success('Message un-sent.')
      getMessages()
    },
  })

  const updateMessages = useCallback(() => {
    getMessages()
  }, [queryVariables])

  useEffect(updateMessages, [updateMessages])

  const columns = tabs[tableViewTab].columns({
    deleteDraft,
    unsendMessage,
    restoreDraft,
  })
  const messages = data?.messages ?? []

  const tableOptions: MUIDataTableOptions = {
    print: false,
    selectableRows: 'single',
    filter: true,
    customToolbarSelect: (selectedRows, displayData) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      const selectedRowIndex = selectedRows.data[0].index
      const dataArray = displayData[selectedRowIndex].data
      const id = dataArray[0]

      return (
        <div>
          {TAB_ACTIONS_SWITCH(
            id,
            tableViewTab,
            deleteDraft,
            unsendMessage,
            restoreDraft,
            classes,
            history,
          )}
        </div>
      )
    },
  }

  return (
    <TitleContainer
      title="Messages"
      actions={() => [
        {
          value: 'New Message',
          onClick: () => history.push('/messaging/mailbox/create'),
        },
      ]}
    >
      <Tabs
        className={classes.ListMessages_addMarginBot}
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTab) => {
          setTableViewTab(newTab)
        }}
      >
        {LIST_TABS.map(tab => (
          <Tab key={tab} value={tab} label={tab} />
        ))}
      </Tabs>
      {loading ? (
        <Loading />
      ) : (
        <MUIDataTable
          title=""
          columns={columns}
          data={messages}
          options={tableOptions}
        />
      )}
    </TitleContainer>
  )
}
