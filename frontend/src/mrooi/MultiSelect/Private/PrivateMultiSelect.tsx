import React from 'react'
import { MenuItem } from '@mui/material'

import { MultiSelect } from '../MultiSelect'

export const PrivateMultiSelect: React.FC = () => {
  const [selectedKeys, setSelectedKeys] = React.useState([
    'key 1',
    'key 2',
    'key 3',
  ])

  const handleOnChange = ({ target: { value } }) => {
    setSelectedKeys(value)
  }

  return (
    <MultiSelect value={selectedKeys} onChange={handleOnChange}>
      {[...new Array(10)].map((_, index) => {
        const keyName = `key ${index}`
        return (
          <MenuItem key={keyName} value={keyName}>
            {keyName}
          </MenuItem>
        )
      })}
    </MultiSelect>
  )
}
