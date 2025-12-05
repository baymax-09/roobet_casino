import React from 'react'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material'

import { useUserNameSearchStyles } from './UserNameSearch.styles'

export const UserNameSearch = ({ users, onLookup }) => {
  const classes = useUserNameSearchStyles()

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>User Id</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Username</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, idx) => (
            <TableRow>
              <TableCell>
                <span
                  className={classes.root}
                  key={idx}
                  onClick={() => onLookup({ index: 'id', key: user.userId })}
                >
                  {user.firstName}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={classes.root}
                  key={idx}
                  onClick={() => onLookup({ index: 'id', key: user.userId })}
                >
                  {user.lastName}
                </span>
              </TableCell>
              <TableCell>{user.userId}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.username}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
