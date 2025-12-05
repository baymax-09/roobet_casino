import React from 'react'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment } from 'common/util/date'

import { type UserData } from '../types'

interface ChatMessagesProps {
  userData: UserData
}

interface ChatMessagesData {
  timestamp: string
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ userData }) => {
  const [data, setData] = React.useState<ChatMessagesData[]>([])

  React.useEffect(() => {
    setData(userData ? userData.chatMessages : [])
  }, [userData])

  const options = {
    expandableRows: false,
    expandableRowsHeader: false,
    expandableRowsOnClick: false,
    searchOpen: false,
    pagination: true,
    sort: true,
    filter: true,
    setTableProps: () => {
      return {
        size: 'small',
      }
    },
  }

  const columns = [
    {
      name: 'timestamp',
      label: 'Timestamp',
      options: {
        customBodyRenderLite: dataIndex => {
          const date = createMoment(data[dataIndex].timestamp)
          return date.format('lll')
        },
        ...DateRangePickerFilter('Timestamp'),
      },
    },
    {
      name: 'message',
      label: 'Message',
      options: {
        filter: false,
      },
    },
  ]

  return (
    <DataTable
      title="Chat Messages"
      data={data}
      columns={columns}
      options={options}
      search={{
        label: 'Message',
        columns: ['message'],
      }}
    />
  )
}
