import React from 'react'
import { TextField } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

interface RaffleModifierIdentifier {
  id: string
  title: string
}

interface RaffleModifierSelectProps {
  initialValues: RaffleModifierIdentifier[]
  data: RaffleModifierIdentifier[]
  index: number
  setFieldValue: (fieldName: string, id: RaffleModifierIdentifier[]) => void
  label: string
}

const getOptionLabel = (option: RaffleModifierIdentifier) =>
  `${option.id} - ${option.title}`
const getOptionSelected = (
  option: RaffleModifierIdentifier,
  value: RaffleModifierIdentifier,
) => option.id === value.id

export const RaffleModifierSelect: React.FC<RaffleModifierSelectProps> = ({
  setFieldValue,
  initialValues,
  data,
  index,
  label,
}) => {
  const handleChange = React.useCallback(
    (_, values: RaffleModifierIdentifier[]) => {
      setFieldValue(`modifiers.${index}.identifiers`, values)
    },
    [index, setFieldValue],
  )

  const renderInput = React.useCallback(
    params => {
      return (
        <TextField
          variant="standard"
          {...params}
          label={label}
          placeholder="Select"
        />
      )
    },
    [label],
  )

  return (
    <Autocomplete
      multiple
      defaultValue={initialValues}
      limitTags={2}
      isOptionEqualToValue={getOptionSelected}
      getOptionLabel={getOptionLabel}
      options={data}
      ChipProps={{
        size: 'small',
        style: { borderRadius: '4px', marginBottom: '8px' },
      }}
      onChange={handleChange}
      renderInput={renderInput}
    />
  )
}
