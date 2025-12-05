import React from 'react'
import { useDebounce } from 'react-use'
import { FormControl, TextField } from '@mui/material'

const DebouncedTextField = ({
  placeholder,
  filterList,
  onChange,
  index,
  column,
}) => {
  const [filter, setFilter] = React.useState<string>()

  useDebounce(
    () => {
      if (filter || filter === '') {
        const filterEntry = filter === '' ? [] : [filter]
        filterList[index] = filterEntry
        onChange(filterEntry, index, column)
      }
    },
    1000,
    [filter],
  )

  return (
    <FormControl variant="standard" fullWidth>
      <TextField
        variant="standard"
        placeholder={placeholder}
        onChange={({ target: { value } }) => {
          setFilter(value)
        }}
      />
    </FormControl>
  )
}

export default React.memo(DebouncedTextField)
