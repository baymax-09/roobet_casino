import React from 'react'

import { DataTable } from 'mrooi'
import { createMoment } from 'common/util/date'

import { type UserData } from '../types'

interface OffersProps {
  userData: UserData
}

interface OffersData {
  timestamp: string
}

export const Offers: React.FC<OffersProps> = ({ userData }) => {
  const [data, setData] = React.useState<OffersData[]>([])

  React.useEffect(() => {
    // due to the nature of how the parent component updates this prop,
    // we need to subscribe to changes manually using a useEffect
    setData(userData ? userData.offers : [])
  }, [userData])

  const options = {
    pagination: false,
    sort: true,
    setTableProps: () => {
      return {
        size: 'small',
      }
    },
  }

  const columns = [
    {
      name: 'createdAt',
      label: 'Timestamp',
      options: {
        customBodyRenderLite: dataIndex => {
          const date = createMoment(data[dataIndex].timestamp)
          return date.format('lll')
        },
      },
    },
    {
      name: 'network',
      label: 'Network',
    },
    {
      name: 'name',
      label: 'Username',
    },
    {
      name: 'value',
      label: 'Value',
    },
  ]

  return (
    <DataTable title="Offers" data={data} columns={columns} options={options} />
  )
}
