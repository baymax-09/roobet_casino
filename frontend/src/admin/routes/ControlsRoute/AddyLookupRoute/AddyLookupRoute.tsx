import React from 'react'
import {
  Button,
  TextField,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material'
import { Form, Formik } from 'formik'
import ReactJson from 'react-json-view'

import { useAxiosGet, useToasts } from 'common/hooks'
import { Loading } from 'mrooi'
import { useDarkMode } from 'admin/context'
import { withRulesAccessController } from 'admin/components'
import { helperTextErrorHelper } from 'admin/util/form'

import { useAddyLookupRouteStyles } from './AddyLookupRoute.styles'

const AddressLookupFormik = withRulesAccessController(
  ['address_lookup:read'],
  Formik,
)

interface DepositAddress {
  _id: string
  id: string
  address?: string
  type: string
  createdAt: string
  updatedAt: string
  _v: number
  destinationTag?: number
}

export const AddyLookupRoute: React.FC = () => {
  const classes = useAddyLookupRouteStyles()
  const [isDarkMode] = useDarkMode()
  const { toast } = useToasts()
  const [addyLookupType, setAddyLookupType] = React.useState('Address')

  const [{ data, loading }, fetchAddy] = useAxiosGet<
    DepositAddress,
    { address?: string; destinationTag?: string }
  >('/admin/users/addressLookup', {
    lazy: true,
    onError: error => {
      console.error('error', error)
      toast.error(error.response.data)
    },
  })
  const addressData = data || {}

  const onSubmit = (values, { setFieldError }) => {
    const fieldKey = addyLookupType === 'Address' ? 'address' : 'destinationTag'
    const value = values[fieldKey]

    if (value) {
      fetchAddy({ [fieldKey]: value })
    } else {
      setFieldError(fieldKey, `Please enter a ${addyLookupType.toLowerCase()}`)
    }
  }

  const handleLookup = (event: SelectChangeEvent<string>) => {
    setAddyLookupType(event.target.value)
  }

  return (
    <div className={classes.root}>
      <AddressLookupFormik
        initialValues={{
          address: '',
          destinationTag: '',
        }}
        onSubmit={onSubmit}
      >
        {({ values, errors, handleChange }) => (
          <Form className={classes.Input__Header}>
            <Select
              defaultValue="lookupType"
              value={addyLookupType}
              onChange={handleLookup}
              className={classes.Select}
            >
              <MenuItem key="Address" value="Address">
                Address
              </MenuItem>
              <MenuItem key="Destination Tag" value="Destination Tag">
                Destination Tag
              </MenuItem>
            </Select>

            <TextField
              variant="standard"
              name={addyLookupType === 'Address' ? 'address' : 'destinationTag'}
              type="text"
              value={
                addyLookupType === 'Address'
                  ? values.address
                  : values.destinationTag
              }
              error={
                !!(addyLookupType === 'Address'
                  ? errors.address
                  : errors.destinationTag)
              }
              helperText={helperTextErrorHelper(
                addyLookupType === 'Address'
                  ? errors.address
                  : errors.destinationTag,
              )}
              onChange={handleChange}
              label={addyLookupType}
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              className={classes.button}
            >
              Submit
            </Button>
          </Form>
        )}
      </AddressLookupFormik>

      {loading ? (
        <Loading />
      ) : (
        <div className={classes.dataContainer}>
          <ReactJson
            theme={isDarkMode ? 'monokai' : undefined}
            src={addressData}
          />
        </div>
      )}
    </div>
  )
}
