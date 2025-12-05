import React from 'react'
import { TextField, Select, InputLabel, Input, MenuItem } from '@mui/material'
import { type FormikErrors } from 'formik'

import { FREE_BET_TYPES } from 'admin/routes/InventoryRoute/HouseInventoryRoute/constants'
import {
  type HouseInventoryItem,
  type HouseInventoryItemError,
} from 'admin/routes/InventoryRoute/types'
import { HOUSE_GAMES } from 'common/types'

import { useBuffSettingsTypesStyles } from './BuffSettingsTypes.styles'

interface FreeBetBuffSettingsProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  handleChange: (e: string | string[] | number) => void
}

export const FreeBetBuffSettings = ({
  values,
  errors,
  handleChange,
}: FreeBetBuffSettingsProps) => {
  const classes = useBuffSettingsTypesStyles()

  const handleSelectChange = <
    T extends string | string[] | number,
    TEvent extends { target: { value: T } },
  >(
    event: TEvent,
  ) => handleChange(event.target.value)

  return (
    <div className={classes.buffsContainer}>
      <InputLabel>Games</InputLabel>
      <Select
        variant="standard"
        multiple
        name="buff.buffSettings.games"
        value={
          'games' in values.buff.buffSettings
            ? values.buff.buffSettings.games
            : []
        }
        error={!!errors.games}
        onChange={handleSelectChange}
        input={<Input />}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 150,
              width: 250,
            },
          },
        }}
      >
        {HOUSE_GAMES.map(houseGame => (
          <MenuItem key={houseGame} value={houseGame}>
            {houseGame}
          </MenuItem>
        ))}
      </Select>
      <div className={classes.freeBetContainer}>
        <TextField
          variant="standard"
          className={classes.freeBetAmount}
          fullWidth
          label="Free Bet Amount"
          type="number"
          name="buff.buffSettings.freeBetAmount"
          error={!!errors.freeBetAmount}
          helperText={errors.freeBetAmount}
          value={
            'freeBetAmount' in values.buff.buffSettings
              ? values.buff.buffSettings.freeBetAmount
              : 0
          }
          onChange={handleSelectChange}
          inputProps={{ min: 0 }}
        />
        <div className={classes.betType}>
          <InputLabel>Bet Type</InputLabel>
          <Select
            variant="standard"
            native
            name="buff.buffSettings.freeBetType"
            label="Free Bet Type"
            value={
              'freeBetType' in values.buff.buffSettings
                ? values.buff.buffSettings.freeBetType
                : ''
            }
            onChange={handleSelectChange}
          >
            {FREE_BET_TYPES.map(value => (
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
