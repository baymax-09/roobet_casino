import React, { useState } from 'react'
import { Tabs, Tab, Button } from '@mui/material'
import { useLazyQuery, useMutation } from '@apollo/client'
import { Link, useHistory } from 'react-router-dom'

import { TitleContainer, DataTable } from 'mrooi'
import {
  MessageTemplatesQuery,
  MessageTemplateDeleteMutation,
  MessageTemplateRestoreMutation,
} from 'admin/gql'
import { useToasts } from 'common/hooks'

import { useMessageTemplateListStyles } from './MessageTemplateList.styles'

const baseColumns = [
  {
    name: 'id',
    label: 'ID',
    type: 'string',
    options: {
      display: false,
    },
  },
  {
    name: 'name',
    label: 'Name',
    type: 'string',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'string',
  },
]

const tabs = {
  active: {
    label: 'Active',
    fetch: () => ({
      variables: {
        deleted: false,
      },
    }),
    columns: ({ deleteTemplate }) => [
      ...baseColumns,
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'string',
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]

            return (
              <div>
                <Button
                  color="primary"
                  size="small"
                  onClick={() =>
                    deleteTemplate({ variables: { data: { id } } })
                  }
                >
                  Delete
                </Button>
                <Link
                  to={`/messaging/templates/${id}/edit`}
                  component={Button}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Edit
                </Link>
              </div>
            )
          },
        },
      },
    ],
  },
  deleted: {
    label: 'Deleted',
    fetch: () => ({
      variables: {
        deleted: true,
      },
    }),
    columns: ({ restoreTemplate }) => [
      ...baseColumns,
      {
        name: 'deletedAt',
        label: 'Deleted At',
        type: 'string',
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]

            return (
              <div>
                <Button
                  color="primary"
                  variant="contained"
                  size="small"
                  onClick={() =>
                    restoreTemplate({ variables: { data: { id } } })
                  }
                >
                  Recover
                </Button>
              </div>
            )
          },
        },
      },
    ],
  },
}

export const MessageTemplateList: React.FC = () => {
  const classes = useMessageTemplateListStyles()
  const history = useHistory()
  const { toast } = useToasts()

  const onError = ({ message }) => {
    toast.error(message)
  }

  const [getTemplates, { data }] = useLazyQuery(MessageTemplatesQuery)

  const [deleteTemplate] = useMutation(MessageTemplateDeleteMutation, {
    onError,
    onCompleted: () => {
      toast.success('Message template deleted.')
      updateTemplates()
    },
  })

  const [restoreTemplate] = useMutation(MessageTemplateRestoreMutation, {
    onError,
    onCompleted: () => {
      toast.success('Message template restored.')
      updateTemplates()
    },
  })

  const [tableViewTab, setTableViewTab] = useState('active')

  const updateTemplates = React.useCallback(() => {
    const { variables } = tabs[tableViewTab].fetch()

    getTemplates({ variables })
  }, [tableViewTab, getTemplates])

  // Load on component mount.
  React.useEffect(updateTemplates, [updateTemplates])

  const columns = tabs[tableViewTab].columns({
    deleteTemplate,
    restoreTemplate,
  })
  const templates = data?.messageTemplates ?? []

  return (
    <TitleContainer
      title="Message Templates"
      returnTo={{
        title: 'Messaging',
      }}
      actions={() => [
        {
          value: 'New Message Template',
          onClick: () => history.push('/messaging/templates/create'),
        },
      ]}
    >
      <Tabs
        className={classes.tabs}
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTabKey) => {
          setTableViewTab(newTabKey)
        }}
      >
        {Object.entries(tabs).map(([key, tab]) => (
          <Tab
            key={key}
            value={key}
            label={tab.label}
            onClick={() => setTableViewTab(key)}
          />
        ))}
      </Tabs>
      <DataTable hideToolbar columns={columns} data={templates} />
    </TitleContainer>
  )
}
