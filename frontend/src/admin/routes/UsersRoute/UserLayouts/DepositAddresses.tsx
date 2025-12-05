import React from 'react'

import { DataTable } from 'mrooi'
import { createMoment } from 'common/util/date'

import { type UserData } from '../types'

interface DepositAddressesProps {
  userData: UserData
}

interface DepositAddressesData {
  timestamp: string
  address: string
  type: string
  legacy: boolean
  tag: string
  wallet: string
}

export const DepositAddresses: React.FC<DepositAddressesProps> = ({
  userData,
}) => {
  const [data, setData] = React.useState<DepositAddressesData[]>([])

  React.useEffect(() => {
    // due to the nature of how the parent component updates this prop,
    // we need to subscribe to changes manually using a useEffect
    setData(userData ? userData.depositAddresses : [])
  }, [userData])

  const options = {
    filter: false,
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
      name: 'timestamp',
      label: 'Created At',
      options: {
        customBodyRenderLite: dataIndex => {
          const date = createMoment(data[dataIndex].timestamp)
          return date.format('lll')
        },
      },
    },
    {
      name: 'address',
      label: 'Address',
      options: {
        customBodyRenderLite: dataIndex => {
          const address = data[dataIndex].address
          if (data[dataIndex].type === 'Bitcoin') {
            return (
              <a
                href={`https://www.blockchain.com/btc/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {address}
              </a>
            )
          }
          if (data[dataIndex].type === 'Ethereum') {
            return (
              <a
                href={`https://www.blockchain.com/eth/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {address}
              </a>
            )
          }
          if (data[dataIndex].type === 'Litecoin') {
            return (
              <a
                href={`https://blockchair.com/litecoin/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {address}
              </a>
            )
          }
          if (data[dataIndex].type === 'Dogecoin') {
            return (
              <a
                href={`https://blockchair.com/dogecoin/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {address}
              </a>
            )
          }
          if (data[dataIndex].type === 'Ripple') {
            return (
              <a
                href={`https://xrpscan.com/account/${data[dataIndex].wallet}`}
                target="_blank"
                rel="noreferrer"
              >
                {data[dataIndex].wallet} : {data[dataIndex].tag}
              </a>
            )
          }
          if (data[dataIndex].type === 'Tron') {
            return (
              <a
                href={`https://tronscan.org/#/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {address}
              </a>
            )
          }
          return address
        },
      },
    },
    {
      name: 'legacy',
      label: 'Legacy',
      options: {
        customBodyRenderLite: dataIndex => {
          if (data[dataIndex].legacy) {
            return 'True'
          }
        },
      },
    },
    {
      name: 'type',
      label: 'Type',
    },
  ]

  return (
    <DataTable
      title="Deposit Addresses"
      data={data}
      columns={columns}
      options={options}
    />
  )
}
