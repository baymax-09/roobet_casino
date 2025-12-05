import React from 'react'
import { type FormikErrors } from 'formik'

import { type BonusCode, type BonusCodeSubmitErrors } from 'admin/types'

import { FreeSpinsTypeSettings } from './FreeSpinsTypeSettings'

interface BonusCodeTypeSettingsProps {
  values: BonusCode
  errors: FormikErrors<BonusCodeSubmitErrors>
  handleChange: (e: string | number | React.ChangeEvent<any>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const BonusCodeTypeSettings: React.FC<BonusCodeTypeSettingsProps> = ({
  values,
  errors,
  handleChange,
  setFieldValue,
}) => {
  return (
    <div>
      {values.type === 'FREESPINS' && (
        <FreeSpinsTypeSettings
          values={values}
          handleChange={handleChange}
          errors={errors}
          setFieldValue={setFieldValue}
        />
      )}
    </div>
  )
}
