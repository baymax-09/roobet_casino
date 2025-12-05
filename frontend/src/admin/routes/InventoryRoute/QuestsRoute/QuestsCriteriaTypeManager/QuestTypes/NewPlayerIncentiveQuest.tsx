import React from 'react'
import { TextField } from '@mui/material'
import { type FormikErrors } from 'formik'

import {
  type DefaultQuest,
  type QuestTemplateError,
} from 'admin/routes/InventoryRoute/types'

interface NewPlayerIncentiveQuestProps {
  values: DefaultQuest
  errors: FormikErrors<QuestTemplateError>
  handleChange: (e: string | React.ChangeEvent<any>) => void
}

export const NewPlayerIncentiveQuest: React.FC<
  NewPlayerIncentiveQuestProps
> = ({ values, errors, handleChange }) => {
  return (
    <TextField
      variant="standard"
      type="number"
      name="wageredAmountUSD"
      value={values.wageredAmountUSD ?? 0}
      error={!!errors.wageredAmountUSD}
      helperText={errors.wageredAmountUSD}
      onChange={handleChange}
      label="Waged Amount in USD"
      inputProps={{ min: 0 }}
    />
  )
}
