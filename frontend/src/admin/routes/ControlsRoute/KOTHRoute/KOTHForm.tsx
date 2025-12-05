import React from 'react'
import { Field, Form, Formik } from 'formik'
import moment from 'moment'
import { DateTimePicker } from 'formik-mui-x-date-pickers'
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
} from '@mui/material'

import { withRulesAccessController } from 'admin/components'
import { type CreateKOTHRequest, type UpdateKOTHRequest } from 'common/types'
import { TitleContainer } from 'mrooi'

import { useKOTHFormStyles } from './KOTHForm.styles'

const UpdateKothFormik = withRulesAccessController(['koth:update'], Formik)
const UpdateKothButton = withRulesAccessController(['koth:update'], Button)

// TODO remove when we are no longer using Formik
const CustomizedSelectForFormik = ({ children, form, field }) => {
  const { name, value } = field
  const { setFieldValue } = form

  if (!value) {
    return null
  }

  return (
    <Select
      variant="standard"
      name={name}
      value={value}
      onChange={event => {
        if (event.target.value === 'astro') {
          setFieldValue('minBet', 5) // Set minBet to 5 when whichRoo is 'astro'.
        }
        setFieldValue(name, event.target.value)
      }}
    >
      {children}
    </Select>
  )
}

type KOTHFormProps =
  | {
      create: true
      initialValues: CreateKOTHRequest
      onFormSubmit: (values: CreateKOTHRequest) => void
    }
  | {
      create: false
      initialValues: UpdateKOTHRequest
      onFormSubmit: (values: UpdateKOTHRequest) => void
    }

export const KOTHForm: React.FC<KOTHFormProps> = ({
  create,
  initialValues,
  onFormSubmit,
}) => {
  const classes = useKOTHFormStyles()

  return (
    <TitleContainer
      title={create ? 'Create KOTH' : 'Update KOTH'}
      returnTo={{
        title: 'KOTHs',
        link: '/crm/koths',
      }}
      actions={() => []}
    >
      <Paper elevation={4} className={classes.KOTHFormContainer}>
        <UpdateKothFormik
          enableReinitialize
          initialValues={{
            startTime: moment(initialValues.startTime).utc(),
            endTime: moment(initialValues.endTime).utc(),
            whichRoo: initialValues.whichRoo,
            minBet: initialValues.minBet,
          }}
          // @ts-expect-error formik onSubmit error
          onSubmit={onFormSubmit}
        >
          {({ values, errors, handleChange }) => (
            <Form className={classes.KOTHFormContainer__form}>
              <Field
                component={DateTimePicker}
                className={classes.Form_addMarginTop}
                fullWidth
                name="startTime"
                label="Start Time"
                value={moment(values.startTime)}
              />

              <Field
                component={DateTimePicker}
                className={classes.Form_addMarginTop}
                fullWidth
                name="endTime"
                label="End Time"
                value={moment(values.endTime)}
              />
              <FormHelperText>Dates are in UTC</FormHelperText>
              <Field
                name="whichRoo"
                component={CustomizedSelectForFormik}
                value={values.whichRoo}
              >
                <MenuItem value="astro">Astro</MenuItem>
                <MenuItem value="king">King</MenuItem>
              </Field>

              {values.whichRoo.includes('king') && (
                <TextField
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  name="minBet"
                  value={values.minBet}
                  error={!!errors.minBet}
                  type="number"
                  onChange={handleChange}
                  label="Minimum Bet"
                />
              )}
              <div className={classes.Form__actions}>
                <UpdateKothButton
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {create ? 'Create' : 'Update'}
                </UpdateKothButton>
              </div>
            </Form>
          )}
        </UpdateKothFormik>
      </Paper>
    </TitleContainer>
  )
}
