import React, { type ChangeEvent } from 'react'
import {
  Typography,
  Select,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material'
import { type FormikErrors } from 'formik'

import {
  type HouseInventoryItemError,
  type HouseInventoryItem,
} from 'admin/routes/InventoryRoute/types'

import { BuffSettingsManager } from './BuffSettingsManager'
import { BUFF_TYPES } from '../constants'

import { useBuffSettingsStyles } from './BuffSettings.styles'

interface BuffSettingsProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  handleChange: (e: string | number | React.ChangeEvent<any>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const BuffSettings = ({
  values,
  errors,
  handleChange,
  setFieldValue,
}: BuffSettingsProps) => {
  const classes = useBuffSettingsStyles()

  const handleBuffTypeChange = (event: SelectChangeEvent<string>) => {
    const type = event.target.value
    setFieldValue('buff', {
      type,
      buffSettings: {
        ...values.buff.buffSettings,
        ...(type === 'FREE_BET' && { freeBetType: 'cash' }),
        ...(type === 'FREE_SPINS' && {
          freeSpins: [
            {
              tpGameAggregator: '',
              numberOfSpins: 0,
              spinAmount: 0,
              games: [],
            },
          ],
        }),
      },
    })
  }

  return (
    <div className={classes.buffSettings}>
      <Typography variant="h5">Buff Settings</Typography>
      <InputLabel>Buff Type</InputLabel>
      <Select
        variant="standard"
        native
        name="buff.type"
        value={values.buff.type}
        onChange={handleBuffTypeChange}
        label="Type"
      >
        {BUFF_TYPES.map(value => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
      <BuffSettingsManager
        values={values}
        handleChange={handleChange}
        errors={errors}
        setFieldValue={setFieldValue}
      />
    </div>
  )
}
