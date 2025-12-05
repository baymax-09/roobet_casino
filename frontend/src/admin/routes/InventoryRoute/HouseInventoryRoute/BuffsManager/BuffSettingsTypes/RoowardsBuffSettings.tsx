import React from 'react'
import { TextField } from '@mui/material'
import { type FormikErrors } from 'formik'

import {
  type HouseInventoryItemError,
  type HouseInventoryItem,
} from 'admin/routes/InventoryRoute/types'

import { useBuffSettingsTypesStyles } from './BuffSettingsTypes.styles'

interface RoowardsBuffSettingsProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  handleChange: (e: string | React.ChangeEvent<any>) => void
}

export const RoowardsBuffSettings: React.FC<RoowardsBuffSettingsProps> = ({
  values,
  errors,
  handleChange,
}) => {
  const classes = useBuffSettingsTypesStyles()
  return (
    <TextField
      variant="standard"
      className={classes.buffsContainer}
      fullWidth
      type="number"
      name="buff.buffSettings.roowardsModifier"
      error={!!errors.roowardsModifier}
      helperText={errors.roowardsModifier}
      value={
        'roowardsModifier' in values.buff.buffSettings
          ? values.buff.buffSettings.roowardsModifier
          : 0
      }
      onChange={handleChange}
      label="Roowards Modifier"
      inputProps={{ min: 0 }}
    />
  )
}
