import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  InputLabel,
} from '@mui/material'

import { TitleContainer } from 'mrooi'
import { type BonusCode, BonusCodeTypeValues } from 'admin/types'

import { BonusCodeTypeSettings } from './BonusCodeTypeSettings'

import { useBonusCodeTemplateStyles } from './BonusCodeTemplate.styles'

export const BonusCodeTemplateForm = ({ title, initialValues, onSubmit }) => {
  const classes = useBonusCodeTemplateStyles()

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'Game Tags List',
        link: '/crm/bonus-codes',
      }}
      actions={() => []}
    >
      <div className={classes.BonusCodeTemplateForm}>
        <Paper
          elevation={4}
          className={classes.BonusCodeTemplateForm__formContainer}
        >
          <Typography
            variant="h5"
            classes={{ h5: classes.BonusCodeTemplateForm__title }}
          >
            {title}
          </Typography>
          <div>
            <Formik<BonusCode>
              enableReinitialize
              initialValues={initialValues}
              onSubmit={onSubmit}
            >
              {({ values, errors, handleChange, setFieldValue }) => (
                <Form className={classes.BonusCodeTemplateForm__form}>
                  <div className={classes.BonusCodeTemplateForm__formSections}>
                    <TextField
                      variant="standard"
                      fullWidth
                      name="name"
                      value={values.name}
                      error={!!errors.name}
                      helperText={errors.name}
                      onChange={handleChange}
                      label="Name"
                    />
                    <TextField
                      variant="standard"
                      fullWidth
                      name="description"
                      value={values.description}
                      error={!!errors.description}
                      helperText={errors.description}
                      onChange={handleChange}
                      label="Description"
                    />
                    <InputLabel
                      className={
                        classes.BonusCodeTemplateForm__bonusTypeInputLabel
                      }
                    >
                      Bonus Type
                    </InputLabel>
                    <Select
                      variant="standard"
                      native
                      fullWidth
                      name="type"
                      value={values.type}
                      onChange={handleChange}
                      label="Type"
                    >
                      {BonusCodeTypeValues.map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className={classes.BonusCodeTemplateForm__formSections}>
                    <BonusCodeTypeSettings
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      setFieldValue={setFieldValue}
                    />
                  </div>
                  <div className={classes.BonusCodeTemplateForm__formButtons}>
                    <Button
                      size="large"
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      {title}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </Paper>
      </div>
    </TitleContainer>
  )
}
