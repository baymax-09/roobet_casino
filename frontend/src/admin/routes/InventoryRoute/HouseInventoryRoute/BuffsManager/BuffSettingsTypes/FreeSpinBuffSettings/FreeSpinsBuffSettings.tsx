import React from 'react'
import { Button } from '@mui/material'
import { type FormikErrors } from 'formik'

import {
  type HouseInventoryItem,
  type HouseInventoryItemError,
} from 'admin/routes/InventoryRoute/types'

import { FreeSpin } from './FreeSpin'

import { useFreeSpinsBuffSettingsStyles } from './FreeSpinsBuffSettings.styles'

interface FreeSpinsBuffSettingsProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  handleChange: (e: string | number | React.ChangeEvent<string>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const FreeSpinsBuffSettings: React.FC<FreeSpinsBuffSettingsProps> = ({
  values,
  errors,
  handleChange,
  setFieldValue,
}) => {
  const classes = useFreeSpinsBuffSettingsStyles()

  const handleAddGroup = () => {
    setFieldValue('buff.buffSettings.freeSpins', [
      ...('freeSpins' in values.buff.buffSettings
        ? values.buff.buffSettings.freeSpins.concat({
            tpGameAggregator: '',
            numberOfSpins: 0,
            spinAmount: 0,
            games: [],
          })
        : []),
    ])
  }

  return (
    <div className={classes.allFreeSpinsGroupsContainer}>
      {'freeSpins' in values.buff.buffSettings &&
        values.buff.buffSettings.freeSpins?.map((freeSpin, index) => {
          return (
            <FreeSpin
              values={values}
              errors={errors}
              index={index}
              key={index}
              freeSpin={freeSpin}
              disableRemoveGroup={
                'freeSpins' in values.buff.buffSettings &&
                values.buff.buffSettings.freeSpins.length <= 1
              }
              handleChange={handleChange}
              setFieldValue={setFieldValue}
            />
          )
        })}
      <Button size="small" variant="contained" onClick={handleAddGroup}>
        + Add Group
      </Button>
    </div>
  )
}
