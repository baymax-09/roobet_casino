import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'
import { providerFreespinReasons } from 'admin/routes/UsersRoute/UserLayouts/ProviderBonuses/freespinReasons'

import SportsbookBonusTemplates from './SportsbookBonusTemplates'
import { exampleSportsbookBonusData } from '../BulkExampleData/index'

const columns = withUserIdOrName([
  {
    name: 'bonusTemplateId',
    label: 'Template ID',
    type: 'string',
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'number',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['freespins:create_bulk'],
  BulkActions,
)
const copyOptions = {
  exampleData: exampleSportsbookBonusData,
}

const BulkSportsbookBonusesRoute: React.FC = () => {
  const [reason, setReason] = React.useState<string>()

  return (
    <>
      <AccessBulkActions
        id="sportsbook-bonus"
        title="Sportsbook Bonuses"
        endpoint="/admin/slotegrator/createBonusBulk"
        columns={columns}
        copy={copyOptions}
        customBodyContent={<SportsbookBonusTemplates />}
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
    </>
  )
}

export default React.memo(BulkSportsbookBonusesRoute)
