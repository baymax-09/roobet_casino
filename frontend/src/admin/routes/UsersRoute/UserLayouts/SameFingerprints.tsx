import React, { Fragment } from 'react'
import { TableRow, TableCell, Paper } from '@mui/material'
import ReactJson from 'react-json-view'
import numeral from 'numeral'

import { DataTable } from 'mrooi'
import { createMoment } from 'common/util/date'
import { useDarkMode } from 'admin/context'

import { type UserData } from '../types'

import { useSameFingerprintsStyles } from './SameFingerprints.styles'

interface SameFingerprintsProps {
  userData: UserData
}

interface SameFingerprintsData {
  createdAt: string
  hiddenTotalBet: number
  hiddenTotalWithdrawn: number
  hiddenTotalDeposited: number
  promosClaimed: number
  role: string
}

export const SameFingerprints: React.FC<SameFingerprintsProps> = ({
  userData,
}) => {
  const classes = useSameFingerprintsStyles()
  const [isDarkMode] = useDarkMode()
  const [data, setData] = React.useState<SameFingerprintsData[]>([])

  React.useEffect(() => {
    // due to the nature of how the parent component updates this prop,
    // we need to subscribe to changes manually using a useEffect
    setData(userData ? userData.sameFingerprints : [])
  }, [userData])

  const options = React.useMemo(
    () => ({
      expandableRows: true,
      expandableRowsHeader: false,
      expandableRowsOnClick: true,
      sort: false,
      setTableProps: () => {
        return {
          // padding: 'none',

          // material ui v4 only
          size: 'small',
        }
      },

      renderExpandableRow: (rowData, { dataIndex }) => {
        const src = data[dataIndex]
        const colSpan = rowData.length + 1

        return (
          <TableRow className={classes.expandedRow}>
            <TableCell colSpan={colSpan}>
              <Paper style={{ padding: 16 }}>
                <ReactJson
                  theme={isDarkMode ? 'monokai' : undefined}
                  name="User"
                  src={src}
                />
              </Paper>
            </TableCell>
          </TableRow>
        )
      },
    }),
    [data, isDarkMode],
  )

  const columns = React.useMemo(
    () => [
      {
        name: 'createdAt',
        label: 'Created At',
        options: {
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].createdAt)
            return date.format('lll')
          },
        },
      },
      {
        name: 'name',
        label: 'Username',
      },
      {
        name: 'hiddenTotalBet',
        label: 'Wagered',
        options: {
          customBodyRenderLite: dataIndex => {
            return (
              numeral(data[dataIndex].hiddenTotalBet).format('$0,0.00') || 0
            )
          },
        },
      },
      {
        name: 'hiddenTotalDeposited',
        label: 'Deposited',
        options: {
          customBodyRenderLite: dataIndex => {
            return (
              numeral(data[dataIndex].hiddenTotalDeposited).format('$0,0.00') ||
              0
            )
          },
        },
      },
      {
        name: 'hiddenTotalWithdrawn',
        label: 'Withdrawn',
        options: {
          customBodyRenderLite: dataIndex => {
            return (
              numeral(data[dataIndex].hiddenTotalWithdrawn).format('$0,0.00') ||
              0
            )
          },
        },
      },
      {
        name: 'promosClaimed',
        label: 'Promos Claimed',
        options: {
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].promosClaimed || 0
          },
        },
      },
      {
        name: 'role',
        label: 'Role',
        options: {
          customBodyRenderLite: (dataIndex, rowIndex) => {
            return data[dataIndex].role
          },
        },
      },
    ],
    [data],
  )

  // DataTable requires an onFetch() so supply an empty one to disable
  const onFetch = (params, tableState) => {
    return () => {
      return data
    }
  }

  return (
    <>
      <DataTable
        title="Same Fingerprints"
        data={data}
        columns={columns}
        options={options}
        serverSide={{
          onFetch,
        }}
      />
    </>
  )
}
