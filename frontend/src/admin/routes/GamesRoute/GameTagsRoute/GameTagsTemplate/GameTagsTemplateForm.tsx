import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  FormLabel,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Switch,
} from '@mui/material'
import { Loading } from '@project-atl/ui'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import moment from 'moment'
import { useHistory } from 'react-router-dom'

import { TitleContainer } from 'mrooi'
import { helperTextErrorHelper } from 'admin/util/form'

import { AddRemoveGames } from '../AddRemoveGames'

import { useGameTagsTemplateStyles } from './GameTagsTemplate.styles'

const SwitchWithLabel = props => {
  const { label, ...rest } = props

  return (
    <div>
      <Switch color="primary" {...rest} />
      <FormLabel>{label}</FormLabel>
    </div>
  )
}

export const GameTagsTemplateForm = ({
  title,
  initialValues,
  onSubmit,
  loading,
}) => {
  const classes = useGameTagsTemplateStyles()
  const history = useHistory()

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const redirect = () => {
    history.push('/games/games-manager/?tab=Tags')
  }

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'Game Tags List',
        link: '/games/games-manager/?tab=Tags',
      }}
      actions={() => []}
    >
      <div className={classes.root}>
        <Paper elevation={4} className={classes.formContainer}>
          <Typography variant="h5" className={classes.title}>
            {title}
          </Typography>
          <div>
            <Formik
              enableReinitialize
              initialValues={initialValues}
              onSubmit={onSubmit}
            >
              {({ values, setValues, errors }) => (
                <Form className={classes.form}>
                  <div className={classes.formSections}>
                    <TextField
                      variant="standard"
                      fullWidth
                      name="title"
                      value={values.title}
                      error={!!errors.title}
                      helperText={helperTextErrorHelper(
                        errors.title || 'Name for internal use',
                      )}
                      onChange={({ target }) =>
                        setValues(values => ({
                          ...values,
                          title: target.value,
                        }))
                      }
                      label="Title"
                    />
                    <TextField
                      variant="standard"
                      fullWidth
                      name="slug"
                      value={values.slug}
                      error={!!errors.slug}
                      helperText={helperTextErrorHelper(
                        errors.slug || 'Slug used in the URL',
                      )}
                      onChange={({ target }) =>
                        setValues(values => ({ ...values, slug: target.value }))
                      }
                      label="Slug"
                    />
                    <div className={classes.formSeg}>
                      <SwitchWithLabel
                        key="Enable Group"
                        label="Enable Group"
                        color="primary"
                        checked={values.enabled ? values.enabled : false}
                        onChange={event =>
                          setValues(values => ({
                            ...values,
                            enabled: event.target.checked,
                          }))
                        }
                      />
                    </div>
                    <div className={classes.formSeg}>
                      <FormControlLabel
                        label="Show on Casino Lobby"
                        control={
                          <Checkbox
                            name="showonhomepage"
                            checked={!!values.showOnHomepage}
                            onChange={({ target }) =>
                              setValues(values => ({
                                ...values,
                                showOnHomepage: target.checked,
                              }))
                            }
                          />
                        }
                      />
                      {values.showOnHomepage && (
                        <FormControl
                          variant="standard"
                          className={classes.formControl}
                        >
                          <InputLabel id="demo-simple-select-label">
                            Page Size
                          </InputLabel>
                          <Select
                            variant="standard"
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={values.pageSize}
                            onChange={event =>
                              setValues(values => ({
                                ...values,
                                pageSize: event.target.value,
                              }))
                            }
                          >
                            <MenuItem value={6}>6</MenuItem>
                            <MenuItem value={12}>12</MenuItem>
                            <MenuItem value={18}>18</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </div>
                  </div>
                  <div className={classes.formSections}>
                    <FormControlLabel
                      label="Set Start and End Date"
                      control={
                        <Checkbox
                          name="Set Start and End Date"
                          checked={
                            !!(
                              values.enableDates ||
                              (values.startDate && values.endDate)
                            )
                          }
                          onChange={({ target }) => {
                            setValues(values => ({
                              ...values,
                              enableDates: target.checked,
                              startDate: target.checked
                                ? moment().toDate()
                                : null,
                              endDate: target.checked
                                ? moment().add(1, 'months').toDate()
                                : null,
                            }))
                          }}
                        />
                      }
                    />
                    {values.enableDates ||
                    (values.startDate && values.endDate) ? (
                      <>
                        <DateTimePicker
                          className={classes.dateContainer}
                          label="Start Date"
                          value={moment(values.startDate)}
                          onChange={date =>
                            setValues(values => ({
                              ...values,
                              startDate: date,
                            }))
                          }
                          disablePast
                          maxDate={
                            values.endDate ? moment(values.endDate) : undefined
                          }
                        />
                        <DateTimePicker
                          label="End Date"
                          className={classes.dateContainer}
                          value={moment(values.endDate)}
                          onChange={date =>
                            setValues(values => ({ ...values, endDate: date }))
                          }
                          disablePast
                        />
                      </>
                    ) : null}
                    <FormControlLabel
                      label="Hide Tag Under Games"
                      control={
                        <Checkbox
                          name="excludeFromTags"
                          checked={!!values.excludeFromTags}
                          onChange={({ target }) =>
                            setValues(values => ({
                              ...values,
                              excludeFromTags: target.checked,
                            }))
                          }
                        />
                      }
                    />
                  </div>
                  <div className={classes.formSections}>
                    <AddRemoveGames
                      tag={values}
                      onGameListUpdate={gameValues =>
                        setValues(values => ({ ...values, games: gameValues }))
                      }
                      reorder={reorder}
                    />
                    {loading ? (
                      <div className={classes.formButtons_loading}>
                        <Loading />
                      </div>
                    ) : (
                      <div className={classes.formButtons}>
                        <Button
                          size="large"
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={!!loading}
                        >
                          {title}
                        </Button>
                        <Button
                          color="primary"
                          onClick={redirect}
                          disabled={!!loading || !initialValues.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
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
