import React from 'react'
import {
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Select,
  InputLabel,
} from '@mui/material'

import { type FrequencyType, type HouseInventoryItem } from '../types'

import { useHouseInventoryRouteStyles } from './HouseInventoryRoute.styles'

interface UsageSettingsProps {
  values: HouseInventoryItem
  handleChange: (e: string | React.ChangeEvent<any>) => void
  frequencyTypes: FrequencyType[]
}

export const UsageSettings: React.FC<UsageSettingsProps> = ({
  values,
  handleChange,
  frequencyTypes,
}) => {
  const classes = useHouseInventoryRouteStyles()

  return (
    <div className={classes.usageSettings}>
      <Typography variant="h5">Usage Settings</Typography>
      <FormControlLabel
        label="Consumed on Depletion"
        control={
          <Checkbox
            name="usageSettings.consumedOnDepletion"
            checked={!!values.usageSettings.consumedOnDepletion}
            onChange={handleChange}
          />
        }
      />
      <div className={classes.limitedUsesContainer}>
        <FormControlLabel
          label="Limited Uses"
          control={
            <Checkbox
              name="usageSettings.hasLimitedUses"
              checked={!!values.usageSettings.hasLimitedUses}
              onChange={handleChange}
            />
          }
        />
        {values.usageSettings.hasLimitedUses && (
          <TextField
            variant="standard"
            fullWidth
            name="usageSettings.usesLeft"
            type="number"
            value={values.usageSettings.usesLeft}
            onChange={handleChange}
            label="Uses left"
          />
        )}
      </div>
      <div className={classes.frequencyAndTypeContainer}>
        <TextField
          variant="standard"
          className={classes.frequencyContainer}
          fullWidth
          name="usageSettings.usageInterval.frequency"
          type="number"
          value={values.usageSettings.usageInterval.frequency}
          onChange={handleChange}
          label="Frequency"
          inputProps={{ min: 0 }}
        />
        <div>
          <InputLabel>Type</InputLabel>
          <Select
            variant="standard"
            native
            name="usageSettings.usageInterval.type"
            value={values.usageSettings.usageInterval.type}
            onChange={event => handleChange(event.target.value)}
            label="Type"
          >
            {frequencyTypes.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
