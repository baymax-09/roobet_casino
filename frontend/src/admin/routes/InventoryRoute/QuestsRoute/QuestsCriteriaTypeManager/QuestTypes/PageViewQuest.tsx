import React from 'react'
import { TextField } from '@mui/material'
import { type FormikErrors } from 'formik'

import {
  type DefaultQuest,
  type QuestTemplateError,
} from 'admin/routes/InventoryRoute/types'

interface PageViewQuestProps {
  values: DefaultQuest
  errors: FormikErrors<QuestTemplateError>
  handleChange: (e: string | React.ChangeEvent<any>) => void
}

export const PageViewQuest = ({
  values,
  handleChange,
  errors,
}: PageViewQuestProps) => {
  return (
    <TextField
      variant="standard"
      name="urlPattern"
      value={values.urlPattern ?? ''}
      error={!!errors.urlPattern}
      helperText={errors.urlPattern}
      onChange={handleChange}
      label="URL Pattern"
    />
  )
}
