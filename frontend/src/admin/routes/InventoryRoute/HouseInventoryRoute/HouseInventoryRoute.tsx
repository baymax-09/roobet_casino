import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Paper,
  Select,
  InputLabel,
} from '@mui/material'
import { useQuery, useMutation } from '@apollo/client'

import { Loading, DataTable, ImagePreviewUpload } from 'mrooi'
import {
  HouseInventoryItemQuery,
  InventoryCreateItemMutation,
  InventoryUpdateItemMutation,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { BuffSettings } from './BuffsManager'
import { UsageSettings } from './UsageSettings'
import { TransferToUser } from './TransferToUser'
import { RARITY_TYPES, BUFF_TYPES, FREQUENCY_TYPES } from './constants'
import {
  type FreeSpinType,
  type HouseInventoryItem,
  type HouseInventoryResults,
  type HouseInventoryItemError,
} from '../types'

import { useHouseInventoryRouteStyles } from './HouseInventoryRoute.styles'

const DEFAULT_INVENTORY: Readonly<HouseInventoryItem> = {
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  rarity: RARITY_TYPES[0],
  buff: {
    type: BUFF_TYPES[0],
    buffSettings: {},
  },
  usageSettings: {
    consumedOnDepletion: false,
    usesLeft: 1,
    hasLimitedUses: false,
    usageInterval: {
      frequency: 1,
      type: FREQUENCY_TYPES[0],
    },
  },
  quantity: 1,
  hasInfiniteQuantity: false,
}

const CreateInventoryItemPaper = withRulesAccessController(
  ['inventory:create'],
  Paper,
)
const CreateInventoryItemButton = withRulesAccessController(
  ['inventory:create'],
  Button,
)
const ReadInventoryItemDatatable = withRulesAccessController(
  ['inventory:read'],
  DataTable,
)
const UpdateInventoryForm = withRulesAccessController(
  ['inventory:update'],
  TransferToUser,
)

export const HouseInventoryRoute: React.FC = () => {
  const classes = useHouseInventoryRouteStyles()
  const { toast } = useToasts()
  const { hasAccess: hasInventoryEditAccess } = useAccessControl([
    'inventory:update',
  ])

  const [selectedInventoryId, setSelectedInventoryId] = React.useState('')

  const { data: houseInvResponse, loading: houseInvLoading } =
    useQuery<HouseInventoryResults>(HouseInventoryItemQuery, {
      onError: error => {
        toast.error(error.message)
      },
    })

  const [inventoryCreateItemMutation] = useMutation(
    InventoryCreateItemMutation,
    {
      update(cache, { data }) {
        const newHouseInventory: HouseInventoryItem =
          data?.inventoryItemCreateMutation
        const existingInventoryItems = cache.readQuery<HouseInventoryResults>({
          query: HouseInventoryItemQuery,
        })
        cache.writeQuery({
          query: HouseInventoryItemQuery,
          data: {
            houseInventory: [
              ...(existingInventoryItems?.houseInventory ?? []),
              newHouseInventory,
            ],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const [inventoryUpdateItemMutation] = useMutation(
    InventoryUpdateItemMutation,
    {
      update(cache, { data }) {
        const newHouseInventory: HouseInventoryItem =
          data?.inventoryItemUpdateMutation
        const existingHouseInventoryItems =
          cache.readQuery<HouseInventoryResults>({
            query: HouseInventoryItemQuery,
          })?.houseInventory

        cache.writeQuery({
          query: HouseInventoryItemQuery,
          data: {
            houseInventory: (existingHouseInventoryItems ?? []).map(item => {
              if (item.id === newHouseInventory.id) {
                return newHouseInventory
              }
              return item
            }),
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const loading = houseInvLoading

  const data = houseInvResponse?.houseInventory || []

  const currentInventory = React.useMemo(() => {
    const houseItem = data.find(
      houseItem => houseItem.id === selectedInventoryId,
    )
    if (houseItem) {
      return {
        ...houseItem,
        buff: {
          ...houseItem.buff,
        },
        usageSettings: {
          ...houseItem.usageSettings,
          usageInterval: {
            ...houseItem.usageSettings.usageInterval,
          },
        },
      }
    }
    return DEFAULT_INVENTORY
  }, [data, selectedInventoryId])

  const rows = (data ?? []).map(houseItem => ({
    Name: houseItem.name,
    Quantity: houseItem.hasInfiniteQuantity ? 'Infinite' : houseItem.quantity,
    Rarity: houseItem.rarity,
    Id: houseItem.id,
  }))

  const columns = React.useMemo(
    () => [
      {
        name: 'Name',
        label: 'Name',
        options: {
          filter: true,
          sort: true,
        },
      },
      {
        name: 'Quantity',
        label: 'Quantity',
        options: {
          filter: false,
          display: true,
        },
      },
      {
        name: 'Rarity',
        label: 'Rarity',
        options: {
          filter: true,
          display: true,
        },
      },
    ],
    [data],
  )

  const handleEdit = (id: string) => {
    setSelectedInventoryId(id)
  }

  const onSubmit = async (values: HouseInventoryItem, { resetForm }) => {
    const {
      id,
      name,
      description,
      imageUrl,
      rarity,
      buff,
      usageSettings,
      quantity,
      hasInfiniteQuantity,
    } = values

    if (id) {
      const result = await inventoryUpdateItemMutation({
        variables: {
          data: {
            id,
            name,
            description,
            rarity,
            quantity,
            imageUrl,
            buff,
            usageSettings,
            hasInfiniteQuantity,
          },
        },
      })
      if (!result.errors) {
        toast.success(`Successfully updated ${name}`)
        resetForm({ values: DEFAULT_INVENTORY })
        setSelectedInventoryId('')
      }
      return
    }

    const result = await inventoryCreateItemMutation({
      variables: {
        data: {
          name,
          description,
          rarity,
          quantity,
          imageUrl,
          buff,
          usageSettings,
          hasInfiniteQuantity,
        },
      },
    })
    if (!result.errors) {
      toast.success(`Successfully created ${name}`)
      resetForm({ values: DEFAULT_INVENTORY })
    }
  }

  const validateHouseInventoryForm = (values: HouseInventoryItem) => {
    const { name, description, imageUrl, buff } = values

    const errors: HouseInventoryItemError = {}

    if (!name.length) {
      errors.name = 'Must specify a name'
    }

    if (!description.length) {
      errors.description = 'Must specify a description'
    }

    if (!imageUrl.length) {
      errors.imageUrl = 'Must have an Image'
      toast.error('Must provide an image')
    }

    const buffSettings = buff.buffSettings

    if (buff.type === 'FREE_BET') {
      if (!buffSettings.games || buffSettings.games.length === 0) {
        errors.games = 'Games must be provided'
      }
      if (!buffSettings.freeBetAmount) {
        errors.freeBetAmount = 'Free Bet Amount must be provided'
      }
    }
    if (buff.type === 'ROOWARDS') {
      if (!buffSettings.roowardsModifier) {
        errors.roowardsModifier = 'Roowards Multiplier must be provided'
      }
    }

    const createFreeSpinsIndex = (
      errors: HouseInventoryItemError,
      index: number,
      freeSpins: FreeSpinType[],
    ) => {
      if (!('freeSpins' in errors)) {
        errors.freeSpins = new Array(freeSpins.length)
      }
      if (!errors.freeSpins?.[index]) {
        errors.freeSpins[index] = {}
      }
    }

    if (buff.type === 'FREE_SPINS') {
      for (let index = 0; index < buffSettings.freeSpins.length; index++) {
        if (!buffSettings.freeSpins[index].tpGameAggregator) {
          createFreeSpinsIndex(errors, index, buffSettings.freeSpins)
          errors.freeSpins[index].tpGameAggregator =
            'TP Game Provider must be provided'
        }
        if (!buffSettings.freeSpins[index].games.length) {
          createFreeSpinsIndex(errors, index, buffSettings.freeSpins)
          errors.freeSpins[index].numberOfSpins = 'Games must be provided'
        }
        if (!buffSettings.freeSpins[index].numberOfSpins) {
          createFreeSpinsIndex(errors, index, buffSettings.freeSpins)
          errors.freeSpins[index].numberOfSpins =
            'Number of Spins must be provided'
        }
        if (!buffSettings.freeSpins[index].spinAmount) {
          createFreeSpinsIndex(errors, index, buffSettings.freeSpins)
          errors.freeSpins[index].spinAmount = 'Spin Amount must be provided'
        }
      }
    }
    return errors
  }

  return (
    <div className={classes.root}>
      <div className={classes.inventoryAndUserContainer}>
        <CreateInventoryItemPaper
          elevation={2}
          className={classes.formContainer}
        >
          <Typography variant="h4" className={classes.title}>
            {currentInventory.id ? '' : 'Create'} Inventory Item
          </Typography>
          <div>
            <Formik
              enableReinitialize
              initialValues={currentInventory}
              onSubmit={onSubmit}
              validate={validateHouseInventoryForm}
              validateOnChange={false}
            >
              {({ values, errors, handleChange, setFieldValue }) => (
                <Form className={classes.form}>
                  <div className={classes.header}>
                    <div className={classes.imageContainer}>
                      <ImagePreviewUpload
                        id="item-image"
                        identifier="item-image"
                        url={values.imageUrl}
                        setUrl={url => setFieldValue('imageUrl', url)}
                      />
                    </div>
                    <div className={classes.rightHeader}>
                      <TextField
                        variant="standard"
                        name="name"
                        value={values.name}
                        error={!!errors.name}
                        helperText={errors.name}
                        onChange={handleChange}
                        label="Name"
                      />
                      <div className={classes.quantityContainer}>
                        <TextField
                          variant="standard"
                          type="number"
                          name="quantity"
                          error={!!errors.quantity}
                          helperText={errors.quantity}
                          value={values.quantity}
                          onChange={handleChange}
                          disabled={values.hasInfiniteQuantity}
                          label="Quantity"
                          inputProps={{ min: 0 }}
                        />
                        <FormControlLabel
                          className={classes.infiniteQuantity}
                          label="Infinite Quantity"
                          control={
                            <Checkbox
                              name="hasInfiniteQuantity"
                              checked={!!values.hasInfiniteQuantity}
                              onChange={handleChange}
                            />
                          }
                        />
                      </div>
                      <div className={classes.rarityContainer}>
                        <InputLabel>Rarity</InputLabel>
                        <Select
                          variant="standard"
                          native
                          name="rarity"
                          value={values.rarity}
                          onChange={handleChange}
                          label="Rarity"
                        >
                          {RARITY_TYPES.map(value => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <TextField
                        label="Description"
                        name="description"
                        error={!!errors.description}
                        helperText={errors.description}
                        multiline
                        rows={4}
                        value={values.description}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </div>
                  </div>
                  <div className={classes.buffAndUsageSettings}>
                    <BuffSettings
                      values={values}
                      errors={errors}
                      handleChange={handleChange}
                      setFieldValue={setFieldValue}
                    />
                    <UsageSettings
                      values={values}
                      handleChange={handleChange}
                      frequencyTypes={FREQUENCY_TYPES}
                    />
                  </div>
                  <div className={classes.buttonsContainer}>
                    <CreateInventoryItemButton
                      size="large"
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      {currentInventory.id ? 'Update' : 'Create'}
                    </CreateInventoryItemButton>
                    {currentInventory.id && (
                      <Button
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                        onClick={() => setSelectedInventoryId('')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </CreateInventoryItemPaper>
      </div>
      <div>
        {loading ? (
          <Loading />
        ) : (
          <ReadInventoryItemDatatable
            title="House Inventory Items"
            data={rows}
            columns={columns}
            rowsEachPage={8}
            options={{
              caseSensitive: true,
              download: false,
              print: false,
              viewColumns: false,
              selectableRows: 'none',
              onRowClick: (_, rowMeta) => {
                hasInventoryEditAccess && handleEdit(rows[rowMeta.dataIndex].Id)
              },
            }}
            search={{
              label: 'Name',
              columns: ['Name'],
            }}
          />
        )}
        {currentInventory.id && (
          <UpdateInventoryForm
            currentInventory={currentInventory}
            hasInfiniteQuantity={currentInventory.hasInfiniteQuantity}
          />
        )}
      </div>
    </div>
  )
}
