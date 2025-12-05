import React from 'react'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleNotesData } from './BulkExampleData'

const columns = withUserIdOrName([
  {
    name: 'note',
    label: 'Note',
    type: 'string',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['user_notes:create_bulk'],
  BulkActions,
)

const copyOptions = {
  exampleData: exampleNotesData,
}

const BulkNotesRoute: React.FC = () => {
  return (
    <AccessBulkActions
      id="user-notes"
      title="User Notes"
      endpoint="/admin/notes/addNoteBulk"
      columns={columns}
      copy={copyOptions}
    />
  )
}

export default React.memo(BulkNotesRoute)
