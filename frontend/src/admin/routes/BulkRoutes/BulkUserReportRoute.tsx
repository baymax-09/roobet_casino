import React from 'react'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleUserReportsData } from './BulkExampleData'

const columns = withUserIdOrName([])

const AccessBulkActions = withRulesAccessController(
  ['reports:create'],
  BulkActions,
)

const copyOptions = {
  exampleData: exampleUserReportsData,
}

const BulkUserReportRoute: React.FC = () => {
  return (
    <AccessBulkActions
      id="user-report"
      title="User Report"
      endpoint="/admin/stats/massUploadUserReport"
      columns={columns}
      copy={copyOptions}
    />
  )
}

export default React.memo(BulkUserReportRoute)
