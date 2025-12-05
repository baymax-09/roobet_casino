import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleSoftswissFreespinData } from './BulkExampleData'
import { providerFreespinReasons } from '../UsersRoute/UserLayouts/ProviderBonuses/freespinReasons'

const columns = withUserIdOrName([
  {
    name: 'rounds',
    label: 'Rounds',
    type: 'number',
  },
  {
    name: 'gameId',
    label: 'Game ID',
    type: 'string',
  },
  {
    name: 'betLevel',
    label: 'Bet Level',
    type: 'number',
  },
  {
    name: 'expirationDate',
    label: 'Exp Date',
    // TODO could be more specific as a Date
    type: 'string',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['freespins:create_bulk'],
  BulkActions,
)
const copyOptions = {
  exampleData: exampleSoftswissFreespinData,
}

const BulkSoftswissFreespinsRoute: React.FC = () => {
  const [reason, setReason] = React.useState<string>()

  return (
    <AccessBulkActions
      id="softswiss-freespins"
      title="Softswiss Freespins"
      endpoint="/softswiss/createFreespinsBulk"
      columns={columns}
      copy={copyOptions}
      bodyParams={{ reason }}
      allowCSVUpload={!!reason}
      prependActionButtons={[
        <FormControl variant="standard">
          <InputLabel id="legacy-reasons">Reason</InputLabel>
          <Select
            variant="standard"
            name="Reasons"
            style={{ width: 150 }}
            labelId="legacy-reasons"
            value={reason}
            onChange={({ target: { value } }) => setReason(value)}
          >
            {providerFreespinReasons.map(reason => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </FormControl>,
      ]}
    />
  )
}

export default React.memo(BulkSoftswissFreespinsRoute)
