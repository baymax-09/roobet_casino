import React from 'react'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material'
import moment from 'moment'

import { useAxiosGet, useToasts } from 'common/hooks'
import { Loading } from 'mrooi'
import { type User } from 'common/types'

import { useIPLookupRouteStyles } from './IPLookupRoute.styles'

const IPLookupView: React.FC<{ ip: string }> = ({ ip }) => {
  const classes = useIPLookupRouteStyles()
  const { toast } = useToasts()

  const [{ data: users, loading, error }] = useAxiosGet<User[]>(
    `/admin/getTouchedIps?ip=${ip}`,
    {
      onError: error => {
        toast.error(error)
      },
    },
  )

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <>Error loading IP users</>
  }

  if (users?.length) {
    return (
      <div className={classes.tableContainer}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Created At</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Deposited</TableCell>
                <TableCell>Withdrawn</TableCell>
                <TableCell>LTV</TableCell>
              </TableRow>
            </TableHead>
            <TableBody className={classes.tableBody}>
              {users.map(function (row, idx) {
                return (
                  <TableRow key={row.id}>
                    <TableCell>{moment(row.createdAt).format('lll')}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      ${row.hiddenTotalDeposited.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ${row.hiddenTotalWithdrawn.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      $
                      {(
                        row.hiddenTotalDeposited - row.hiddenTotalWithdrawn
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    )
  }
  return <div>No accounts have touched his IP</div>
}

export default IPLookupView
