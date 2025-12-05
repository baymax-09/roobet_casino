import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Paper,
} from '@mui/material'
import { useQuery, useMutation } from '@apollo/client'

import { Loading, DataTable } from 'mrooi'
import { indexBy } from 'common/util'
import {
  RewardInventoryItemQuery,
  HouseInventoryItemQuery,
  InventoryItemRewardCreateMutation,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { AddRemoveItems } from './AddRemoveItems'
import {
  type HouseInventoryItem,
  type HouseInventoryResults,
  type RewardInventory,
  type RewardInventoryResults,
} from '../types'

import { useRewardsInventoryRouteStyles } from './RewardsInventoryRoute.styles'

const DEFAULT_REWARD: Readonly<RewardInventory> = {
  id: '',
  name: '',
  dropRate: 0,
  canBeClaimedOnlyOnce: true,
  quantity: 0,
  hasInfiniteQuantity: false,
  items: [],
}

const CreateInventoryRewardPaper = withRulesAccessController(
  ['inventory:create'],
  Paper,
)
const CreateInventoryRewardButton = withRulesAccessController(
  ['inventory:create'],
  Button,
)
const ReadInventoryRewardDatatable = withRulesAccessController(
  ['inventory:read'],
  DataTable,
)

export const RewardsInventoryRoute: React.FC = () => {
  const classes = useRewardsInventoryRouteStyles()
  const { toast } = useToasts()
  const { hasAccess: hasInventoryRewardEditAccess } = useAccessControl([
    'inventory:update',
  ])

  const [selectedRewardId, setSelectedRewardId] = React.useState('')

  const { data: rewardsResponse, loading: rewardsLoading } =
    useQuery<RewardInventoryResults>(RewardInventoryItemQuery, {
      onError: error => {
        toast.error(error.message)
      },
    })

  const { data: houseInvResponse, loading: houseInvLoading } =
    useQuery<HouseInventoryResults>(HouseInventoryItemQuery, {
      onError: error => {
        toast.error(error.message)
      },
    })

  const [inventoryCreateRewardItemMutation] = useMutation(
    InventoryItemRewardCreateMutation,
    {
      update(cache, { data }) {
        const newRewardInventory = data?.inventoryItemRewardCreateMutation
        const existingRewardItems = cache.readQuery<RewardInventoryResults>({
          query: RewardInventoryItemQuery,
        })
        cache.writeQuery({
          query: RewardInventoryItemQuery,
          data: {
            inventoryItemRewards: [
              ...(existingRewardItems?.inventoryItemRewards ?? []),
              newRewardInventory,
            ],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const loading = rewardsLoading && houseInvLoading

  const data = rewardsResponse?.inventoryItemRewards || []

  const currentReward = React.useMemo(() => {
    const reward = data.find(reward => reward.id === selectedRewardId)
    return reward || DEFAULT_REWARD
  }, [data, selectedRewardId])

  const rows = (data ?? []).map(reward => ({
    Name: reward.name,
    Quantity: reward.hasInfiniteQuantity ? 'Infinite' : reward.quantity,
    'Claimed Only Once': reward.canBeClaimedOnlyOnce ? 'Yes' : 'No',
    Id: reward.id,
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
        name: 'Claimed Only Once',
        label: 'Claimed Only Once',
        options: {
          filter: true,
          display: true,
        },
      },
    ],
    [data],
  )

  const handleEdit = (id: string) => {
    setSelectedRewardId(id)
  }

  const onSubmit = async (values: RewardInventory, { resetForm }) => {
    const {
      id,
      name,
      dropRate,
      canBeClaimedOnlyOnce,
      quantity,
      hasInfiniteQuantity,
      items,
    } = values

    if (id) {
      setSelectedRewardId('')
      return
    }

    const itemIds = items.map(item => item.id)

    const result = await inventoryCreateRewardItemMutation({
      variables: {
        data: {
          name,
          dropRate,
          canBeClaimedOnlyOnce,
          quantity,
          hasInfiniteQuantity,
          itemIds,
        },
      },
    })
    if (!result.errors) {
      toast.success(`Successfully created ${name}`)
      resetForm({ values: DEFAULT_REWARD })
    }
  }

  const onHouseItemListUpdate =
    (setValues: (values: React.SetStateAction<RewardInventory>) => void) =>
    items => {
      setValues(values => ({ ...values, items }))
    }

  const validateRewardForm = (values: RewardInventory) => {
    const { name, dropRate, items } = values

    const errors: Partial<Record<keyof RewardInventory, string>> = {}

    if (!name.length) {
      errors.name = 'Must specify a name'
    }

    if (!dropRate) {
      errors.dropRate = 'Must specify a drop rate'
    }

    if (!items.length) {
      toast.error('Must specify inventory items for the reward')
      errors.items = 'Must specify inventory items for the reward'
    }

    return errors
  }

  const houseItems = React.useMemo(
    () => houseInvResponse?.houseInventory ?? [],
    [houseInvResponse?.houseInventory],
  )
  // This value must be memoized to reduce render lag.
  const houseItemsById: Record<string, HouseInventoryItem> = React.useMemo(
    () => indexBy(houseItems, 'id'),
    [houseItems],
  )

  return (
    <div className={classes.root}>
      <div className={classes.inventoryAndUserContainer}>
        <CreateInventoryRewardPaper
          elevation={2}
          className={classes.formContainer}
        >
          <Typography variant="h4" className={classes.title}>
            {currentReward.id ? '' : 'Create'} Reward
          </Typography>
          <div>
            <Formik
              enableReinitialize
              initialValues={currentReward}
              onSubmit={onSubmit}
              validate={validateRewardForm}
              validateOnChange={false}
            >
              {({ values, errors, handleChange, setValues }) => (
                <Form className={classes.form}>
                  <div className={classes.header}>
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
                      <TextField
                        variant="standard"
                        type="number"
                        name="dropRate"
                        error={!!errors.dropRate}
                        helperText={errors.dropRate}
                        value={values.dropRate}
                        onChange={handleChange}
                        label="Drop Rate"
                        inputProps={{ min: 0, max: 100 }}
                      />
                      <FormControlLabel
                        className={classes.infiniteQuantity}
                        label="Claimed Only Once"
                        control={
                          <Checkbox
                            name="canBeClaimedOnlyOnce"
                            checked={!!values.canBeClaimedOnlyOnce}
                            onChange={handleChange}
                          />
                        }
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
                      <AddRemoveItems
                        tags={values.items}
                        allHouseItems={houseItems}
                        houseItemsById={houseItemsById}
                        onHouseItemListUpdate={onHouseItemListUpdate(setValues)}
                      />
                    </div>
                  </div>
                  <div className={classes.formButtons}>
                    <CreateInventoryRewardButton
                      size="large"
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      {currentReward.id ? 'Cancel' : 'Create'}
                    </CreateInventoryRewardButton>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </CreateInventoryRewardPaper>
      </div>
      <div>
        {loading ? (
          <Loading />
        ) : (
          <ReadInventoryRewardDatatable
            title="Rewards"
            data={rows}
            columns={columns}
            rowsEachPage={10}
            options={{
              caseSensitive: true,
              download: false,
              print: false,
              viewColumns: false,
              selectableRows: 'none',
              onRowClick: (_, rowMeta) => {
                hasInventoryRewardEditAccess &&
                  handleEdit(rows[rowMeta.dataIndex].Id)
              },
            }}
            search={{
              label: 'Name',
              columns: ['Name'],
            }}
          />
        )}
      </div>
    </div>
  )
}
