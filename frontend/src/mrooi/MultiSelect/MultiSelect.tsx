import React from 'react'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import { Select, type SelectProps } from '@mui/material'

import { useMultiSelectStyles } from './MultiSelect.styles'

interface MultiSelectProps {
  value: string[]
  onChange: SelectProps['onChange']
}

export const MultiSelect: React.FC<
  React.PropsWithChildren<MultiSelectProps>
> = ({ value, onChange, children }) => {
  const classes = useMultiSelectStyles()

  const ITEM_HEIGHT = 48
  const ITEM_PADDING_TOP = 8
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  }

  return (
    <FormControl variant="standard" className={classes.formControl}>
      <Select
        className={classes.select}
        multiple
        value={value}
        onChange={onChange}
        renderValue={(selected: any) => (
          <div className={classes.chips}>
            {selected.map(value => (
              <Chip key={value} label={value} className={classes.chip} />
            ))}
          </div>
        )}
        variant="outlined"
        MenuProps={MenuProps}
      >
        {children}
      </Select>
    </FormControl>
  )
}
