import React, { useEffect, useState } from 'react'
import {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'

import { DataTable } from 'mrooi'
import { createMoment } from 'common/util/date'
import { env } from 'common/constants'

import { type UserData } from '../types'

interface TouchedIPsProps {
  userData: UserData
}

interface TouchedIPData {
  updatedAt: string
}

export const TouchedIPs: React.FC<TouchedIPsProps> = ({ userData }) => {
  const [data, setData] = useState<TouchedIPData[]>([])

  useEffect(() => {
    // due to the nature of how the parent component updates this prop,
    // we need to subscribe to changes manually using a useEffect
    setData(userData ? userData.touchedIPs : [])
  }, [userData])

  const options: MUIDataTableOptions = {
    filter: true,
    pagination: false,
    sort: true,
    setTableProps: () => {
      return {
        size: 'small',
      }
    },
    sortOrder: {
      direction: 'desc',
      name: 'uses',
    },
  }

  const columns: MUIDataTableColumn[] = [
    {
      name: 'ip',
      label: 'IP',
      options: {
        filter: false,
      },
    },
    {
      name: 'countryCode',
      label: 'Country Code',
      options: {
        customFilterListOptions: {
          render: countryCode => `Country Code: ${countryCode}`,
        },
        customBodyRender: countryCode =>
          countryCode &&
          countryCode !== 'N/A' &&
          countryCode !== 'INVALID IP ADDRESS'
            ? countryCode
            : 'Unknown',
        filterList: ['Known'],
        filterType: 'dropdown',
        filterOptions: {
          fullWidth: true,
          names: ['Known', 'Unknown'],
          logic: (countryCode, [filters]) =>
            filters === 'Unknown'
              ? countryCode !== 'Unknown'
              : countryCode === 'Unknown',
        },
      },
    },
    {
      name: 'uses',
      label: 'Uses',
      options: {
        sort: true,
        filter: false,
      },
    },
    {
      name: 'updatedAt',
      label: 'Last Used',
      options: {
        customBodyRenderLite: dataIndex => {
          const date = createMoment(data[dataIndex].updatedAt)
          return date.format('lll')
        },
        filter: false,
      },
    },
  ]

  return (
    <DataTable
      title="IP Addresses"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/users/ips/export?userId=${userData.user.id}`}
    />
  )
}
