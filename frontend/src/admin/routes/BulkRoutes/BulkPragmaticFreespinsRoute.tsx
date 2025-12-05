import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { examplePragmaticFreespinData } from './BulkExampleData/index'
import { providerFreespinReasons } from '../UsersRoute/UserLayouts/ProviderBonuses/freespinReasons'

const columns = withUserIdOrName([
  {
    name: 'rounds',
    label: 'Rounds',
    type: 'number',
  },
  {
    name: 'periodOfTime',
    label: 'Period Of Time',
    type: 'number',
  },
  {
    name: 'gameId',
    label: 'Game ID',
    type: 'string',
  },
  {
    name: 'betPerRound',
    label: 'Bet Per Round',
    type: 'number',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    // TODO could be more specific
    type: 'string',
  },
  {
    name: 'expirationDate',
    label: 'Exp. Date',
    // TODO could be more specific
    type: 'string',
  },
  {
    name: 'frType',
    label: 'Freespins or Bonus Buy',
    // TODO could be more specific, I'm not sure what the valid values are we don't store them
    type: 'string',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['freespins:create_bulk'],
  BulkActions,
)

const copyOptions = {
  exampleData: examplePragmaticFreespinData,
}

const BulkPragmaticFreespinsRoute: React.FC = () => {
  const [reason, setReason] = React.useState<string>()

  return (
    <AccessBulkActions
      id="pragmatic-freespins"
      title="Pragmatic Freespins"
      endpoint="/pragmatic/internal/createFreespinsBulk"
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

export default React.memo(BulkPragmaticFreespinsRoute)
