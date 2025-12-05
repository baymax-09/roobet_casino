import React from 'react'
import { type FormikErrors } from 'formik'

import { FreeSpinsBuffSettings } from './BuffSettingsTypes'
import {
  type HouseInventoryItemError,
  type HouseInventoryItem,
} from '../../types'

interface BuffSettingsManagerProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  handleChange: (e: string | number | React.ChangeEvent<any>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const BuffSettingsManager: React.FC<BuffSettingsManagerProps> = ({
  values,
  errors,
  handleChange,
  setFieldValue,
}) => {
  return (
    <>
      {/* {values.buff.type === 'FREE_BET' &&
        <FreeBetBuffSettings
          values={values}
          handleChange={handleChange}
          errors={errors}
        />} */}
      {/* {values.buff.type === 'ROOWARDS' &&
        <RoowardsBuffSettings
          values={values}
          handleChange={handleChange}
          errors={errors}
        />} */}
      {values.buff.type === 'FREE_SPINS' && (
        <FreeSpinsBuffSettings
          values={values}
          handleChange={handleChange}
          errors={errors}
          setFieldValue={setFieldValue}
        />
      )}
      {/* {values.buff.type === 'EMOTE' &&
        <EmoteBuffSettings
          values={values}
          handleChange={handleChange}
          errors={errors}
        />} */}
    </>
  )
}
