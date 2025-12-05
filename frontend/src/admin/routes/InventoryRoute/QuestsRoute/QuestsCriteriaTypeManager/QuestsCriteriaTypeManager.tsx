import React from 'react'
import { type FormikErrors } from 'formik'

import {
  type DefaultQuest,
  type QuestTemplateError,
} from 'admin/routes/InventoryRoute/types'

import { PageViewQuest, NewPlayerIncentiveQuest } from './QuestTypes'

interface QuestsCriteriaTypeManagerProps {
  values: DefaultQuest
  errors: FormikErrors<QuestTemplateError>
  handleChange: (e: string | React.ChangeEvent<any>) => void
}

export const QuestsCriteriaTypeManager = ({
  values,
  errors,
  handleChange,
}: QuestsCriteriaTypeManagerProps) => {
  return (
    <>
      {values.criteriaType === 'PAGE_VIEW' && (
        <PageViewQuest
          values={values}
          errors={errors}
          handleChange={handleChange}
        />
      )}
      {values.criteriaType === 'NEW_PLAYER_INCENTIVE' && (
        <NewPlayerIncentiveQuest
          values={values}
          errors={errors}
          handleChange={handleChange}
        />
      )}
    </>
  )
}
