import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleSlotegratorFreespinData } from './BulkExampleData/index'
import { providerFreespinReasons } from '../UsersRoute/UserLayouts/ProviderBonuses/freespinReasons'

const columns = withUserIdOrName([
  {
    name: 'rounds',
    label: 'Rounds',
    type: 'number',
  },
  {
    name: 'campaignName',
    label: 'Campaign Name',
    type: 'string',
  },
  {
    name: 'gameIdentifier',
    label: 'Game Identifier',
    type: 'string',
  },
  {
    name: 'betLevel',
    label: 'BetLevel',
    type: 'string',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['freespins:create_bulk'],
  BulkActions,
)

const copyOptions = {
  exampleData: exampleSlotegratorFreespinData,
}

export const BulkSlotegratorFreespinsRoute: React.FC = () => {
  const [reason, setReason] = React.useState<string | undefined>()

  const handleReasonChange = event => {
    setReason(event.target.value)
  }

  return (
    <AccessBulkActions
      id="slotegrator-freespins"
      title="Slotegrator Freespins"
      endpoint="/slotegrator/gis/admin/freespins/createBulk"
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
            value={reason || ''}
            onChange={handleReasonChange}
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
