import React from 'react'
import { Button, TextField, Typography, Paper } from '@mui/material'
import { useMutation } from '@apollo/client'
import { Form, Formik } from 'formik'

import { Loading } from 'mrooi'
import { HouseInventoryItemQuery, InventoryItemsAddToUser } from 'admin/gql'
import { useToasts } from 'common/hooks'

import {
  type HouseInventoryItem,
  type HouseInventoryResults,
  type TransferToUserType,
  type TransferToUserTypeError,
} from '../types'

import { useHouseInventoryRouteStyles } from './HouseInventoryRoute.styles'

interface TransferToUserProps {
  currentInventory: HouseInventoryItem
  hasInfiniteQuantity: boolean
}

const DEFAULT_TRANSFER_USER = {
  transferUserId: '',
  transferQuantity: 0,
} as const

export const TransferToUser: React.FC<TransferToUserProps> = ({
  currentInventory,
  hasInfiniteQuantity,
}) => {
  const classes = useHouseInventoryRouteStyles()
  const { toast } = useToasts()

  const [invAddItemsToUserMutation, { loading }] = useMutation(
    InventoryItemsAddToUser,
    {
      update(cache, { data }) {
        const newHouseInventoryItem = data?.inventoryItemsAddToUser
        const existingInventoryItems = cache.readQuery<HouseInventoryResults>({
          query: HouseInventoryItemQuery,
        })
        const houseInventoryItems =
          existingInventoryItems?.houseInventory.map(item => {
            if (item.id === newHouseInventoryItem.id) {
              return newHouseInventoryItem
            }
            return item
          }) ?? []
        cache.writeQuery({
          query: HouseInventoryItemQuery,
          data: {
            houseInventory: [...houseInventoryItems],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const onSubmit = async (values: TransferToUserType) => {
    const result = await invAddItemsToUserMutation({
      variables: {
        data: {
          itemId: currentInventory.id,
          quantity: values.transferQuantity,
          userId: values.transferUserId,
        },
      },
    })
    if (!result.errors) {
      toast.success(
        `Successfully transferred ${values.transferQuantity} item(s) to ${values.transferUserId}`,
      )
    }
  }

  const validateUserTransferForm = (values: TransferToUserType) => {
    const { transferQuantity, transferUserId } = values

    const errors: TransferToUserTypeError = {}

    const uuidRegexExp =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

    if (!transferQuantity) {
      errors.transferQuantity =
        'Must have a quantity greater than 0 to transfer to user.'
    }
    if (transferQuantity > currentInventory.quantity && !hasInfiniteQuantity) {
      errors.transferQuantity =
        'Cannot transfer more than house inventory quantity.'
    }
    if (!transferUserId || !uuidRegexExp.test(transferUserId)) {
      errors.transferUserId = 'Must have a valid user ID to transfer to user.'
    }

    return errors
  }

  return (
    <Paper elevation={2} className={classes.transferToUser}>
      <div className={classes.transferUserContainer}>
        <Typography variant="h5">Transfer to User</Typography>
        {loading ? (
          <Loading className={classes.loading} />
        ) : (
          <Formik
            enableReinitialize
            initialValues={DEFAULT_TRANSFER_USER}
            onSubmit={onSubmit}
            validate={validateUserTransferForm}
            validateOnChange={false}
          >
            {({ values, errors, handleChange }) => (
              <Form>
                <TextField
                  variant="standard"
                  className={classes.userIdContainer}
                  fullWidth
                  name="transferUserId"
                  value={values.transferUserId}
                  error={!!errors.transferUserId}
                  helperText={errors.transferUserId}
                  onChange={handleChange}
                  label="User ID"
                />
                <TextField
                  variant="standard"
                  name="transferQuantity"
                  type="number"
                  value={values.transferQuantity}
                  error={!!errors.transferQuantity}
                  helperText={errors.transferQuantity}
                  onChange={handleChange}
                  label="Quantity"
                  inputProps={{ min: 0 }}
                />
                <Button
                  className={classes.transferButton}
                  type="submit"
                  size="large"
                  variant="contained"
                  color="primary"
                >
                  Transfer
                </Button>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </Paper>
  )
}
