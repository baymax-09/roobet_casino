import { type MessageTabData } from 'admin/types/messages'

const baseColumns = [
  {
    name: 'id',
    label: 'ID',
    options: {
      display: false,
    },
  },
  {
    name: 'title',
    label: 'Message',
  },
]

export type TabName = 'Drafts' | 'Sent' | 'Deleted'

export const tabs: Record<TabName, MessageTabData> = {
  Drafts: {
    label: 'Drafts',
    columns: () => [
      ...baseColumns,
      {
        name: 'createdAt',
        label: 'Created at',
        type: 'string',
      },
    ],
  },
  Sent: {
    label: 'Sent',
    columns: () => [
      ...baseColumns,
      {
        name: 'liveAt',
        label: 'Sent At',
        type: 'string',
      },
      {
        name: 'recipientCount',
        label: 'Recipients',
        type: 'string',
        options: {
          customBodyRender: (value: string) => {
            return Number(value ?? 0).toLocaleString()
          },
        },
      },
      {
        name: 'readCount',
        label: 'Read By',
        type: 'string',
        options: {
          customBodyRender: (value: string) => {
            return Number(value ?? 0).toLocaleString()
          },
        },
      },
      {
        name: 'notOpenedBy',
        label: 'Not Opened By',
        type: 'number',
        options: {
          customBodyRender: (_, { rowData }) => {
            const recipients = rowData[3] ?? 0
            const read = rowData[4] ?? 0

            return Number(recipients - read).toLocaleString()
          },
        },
      },
    ],
  },
  Deleted: {
    label: 'Deleted (drafts)',
    columns: () => [
      ...baseColumns,
      {
        name: 'deletedAt',
        label: 'Deleted At',
        type: 'string',
      },
    ],
  },
}
