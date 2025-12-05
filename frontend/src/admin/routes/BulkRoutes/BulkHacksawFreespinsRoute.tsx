import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleHacksawFreespinData } from './BulkExampleData'
import { providerFreespinReasons } from '../UsersRoute/UserLayouts/ProviderBonuses/freespinReasons'

const columns = withUserIdOrName([
  {
    name: 'rounds',
    label: 'Rounds',
    type: 'number',
  },
  {
    name: 'gameId',
    label: 'Game ID (ex: 1117)',
    type: 'number',
  },
  {
    name: 'amount',
    label: 'Bet Per Round',
    type: 'number',
  },
  {
    name: 'expirationDate',
    label: 'Exp Date (ex: mm/dd/yyyy)',
    // TODO could be more specific
    type: 'string',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['freespins:create_bulk'],
  BulkActions,
)
const copyOptions = {
  exampleData: exampleHacksawFreespinData,
}

const BulkHacksawFreespinsRoute: React.FC = () => {
  const [reason, setReason] = React.useState<string>()

  return (
    <AccessBulkActions
      id="hacksaw-freespins"
      title="Hacksaw Freespins"
      endpoint="/hacksaw/internal/createFreespinsBulk"
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
            required
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

export default React.memo(BulkHacksawFreespinsRoute)
