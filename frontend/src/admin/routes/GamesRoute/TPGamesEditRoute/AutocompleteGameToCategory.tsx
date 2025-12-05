import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import { TextField, MenuItem } from '@mui/material'

interface AutoCompleteCategoryProps {
  categoryNames: string[]
  currentCategory?: string
  onCategoryChange: (newCategory: string) => void
}

export const AutoCompleteGameToCategory: React.FC<
  AutoCompleteCategoryProps
> = ({ categoryNames, currentCategory, onCategoryChange }) => {
  // handles custom input on component
  const handleInputChange = (_, newCategory: string) => {
    onCategoryChange(newCategory)
  }

  return (
    <div>
      <Autocomplete
        value={currentCategory ?? ''}
        options={categoryNames}
        getOptionLabel={option => option}
        renderInput={params => (
          <TextField {...params} label="Category" variant="outlined" />
        )}
        onInputChange={handleInputChange}
        freeSolo
        renderOption={(prop, option) => (
          <MenuItem {...prop} key={option} value={option}>
            {option}
          </MenuItem>
        )}
      />
    </div>
  )
}
