import React, { useCallback } from 'react'
import { MenuItem, TextField, Grid } from '@mui/material'

import { type RaffleModifier, RaffleModifierTypes } from 'common/types'

import {
  RaffleModifierByProviderSelect,
  RaffleModifierByGamesSelect,
  RaffleModifierByGroupSelect,
} from './RaffleModifierSelect'

interface RaffleFormModifierProps {
  modifier?: RaffleModifier
  baseDollarAmount?: number
  index: number
  handleChange: (e: React.ChangeEvent<any>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  errors: Record<string, string>
}

export const RaffleFormModifier: React.FC<RaffleFormModifierProps> = ({
  errors,
  index,
  handleChange,
  setFieldValue,
  modifier,
  baseDollarAmount,
}) => {
  const handleModifierTypeChange = useCallback(
    event => {
      setFieldValue(`modifier.${index}.identifiers`, [])
      handleChange(event)
    },
    [handleChange, index, setFieldValue],
  )

  return (
    <>
      <Grid item xs={6}>
        <TextField
          variant="standard"
          select
          fullWidth
          name={`modifiers.${index}.type`}
          type="text"
          value={modifier?.type}
          error={!!errors[`modifiers.${index}.type`]}
          helperText={errors[`modifiers.${index}.type`]}
          onChange={event => handleModifierTypeChange(event)}
          margin="normal"
          label="Modifier Type"
        >
          {RaffleModifierTypes.map(raffleModifierType => (
            <MenuItem key={raffleModifierType} value={raffleModifierType}>
              {raffleModifierType}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={3}>
        <TextField
          variant="standard"
          fullWidth
          name={`modifiers.${index}.ticketsPerDollar`}
          type="number"
          inputProps={{ step: 0.01 }}
          value={modifier?.ticketsPerDollar}
          error={!!errors[`modifiers.${index}.ticketsPerDollar`]}
          helperText={errors[`modifiers.${index}.ticketsPerDollar`]}
          onChange={handleChange}
          margin="normal"
          label="Tickets"
        />
      </Grid>

      <Grid item xs={3}>
        <TextField
          variant="standard"
          fullWidth
          disabled
          name="baseDollarAmount"
          type="number"
          value={baseDollarAmount}
          margin="normal"
          label="Per dollar amount"
        />
      </Grid>

      <Grid item xs={12}>
        {modifier?.type === 'gameIdentifier' && (
          <RaffleModifierByGamesSelect
            index={index}
            setFieldValue={setFieldValue}
            initialValues={modifier.identifiers || []}
          />
        )}

        {modifier?.type === 'gameProvider' && (
          <RaffleModifierByProviderSelect
            index={index}
            setFieldValue={setFieldValue}
            initialValues={modifier.identifiers || []}
          />
        )}

        {modifier?.type === 'gameGroup' && (
          <RaffleModifierByGroupSelect
            index={index}
            setFieldValue={setFieldValue}
            initialValues={modifier.identifiers || []}
          />
        )}
      </Grid>
    </>
  )
}
