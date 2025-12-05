import React from 'react'
import numeral from 'numeral'
import { Select, MenuItem, InputLabel, FormControl } from '@mui/material'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleUserBonusData } from './BulkExampleData'
import {
  BALANCE_CHANGE_OPERATIONS,
  type BalanceChangeType,
} from '../UsersRoute/UserLayouts/OverviewViewTypes/balanceChanges'

const BULK_CHANGE_TYPES: BalanceChangeType[] = ['add', 'bonus']

const columns = withUserIdOrName([
  {
    name: 'amount',
    label: 'Amount',
    type: 'number',
    options: {
      customBodyRender: (_, { rowData, columnIndex }) => {
        return numeral(rowData[columnIndex]).format('$0,0.00[00]')
      },
    },
  },
  {
    name: 'balanceType',
    label: 'Balance Type',
    type: 'string',
  },
])

const copyOptions = {
  exampleData: exampleUserBonusData,
}

const AccessBulkActions = withRulesAccessController(
  ['balances:vip_bulk'],
  BulkActions,
)

const BulkBalanceAddRoute: React.FC = () => {
  const [type, setType] = React.useState<BalanceChangeType>()
  const [reason, setReason] = React.useState<string>()

  // Reset reason select when type changes.
  React.useEffect(() => {
    setReason(undefined)
  }, [type])

  return (
    <AccessBulkActions
      id="user-bonuses"
      title="Balance Add"
      endpoint="/admin/user/addRewardBulk"
      columns={columns}
      copy={copyOptions}
      allowCSVUpload={!!reason}
      bodyParams={{ type, reason }}
      prependActionButtons={[
        <>
          <FormControl variant="standard">
            <InputLabel id="type">Type</InputLabel>
            <Select
              variant="standard"
              name="Type"
              style={{ width: 150, marginRight: 16 }}
              labelId="type"
              value={type}
              onChange={({ target: { value } }) =>
                setType(value as BalanceChangeType)
              }
            >
              {BULK_CHANGE_TYPES.map(changeType => {
                const config = BALANCE_CHANGE_OPERATIONS[changeType]('crypto')
                return (
                  <MenuItem key={changeType} value={changeType}>
                    {config.title}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl variant="standard">
            <InputLabel id="legacy-reasons">Reason</InputLabel>
            <Select
              variant="standard"
              name="Legacy Reasons"
              style={{ width: 150 }}
              labelId="legacy-reasons"
              value={reason}
              disabled={!type}
              onChange={({ target: { value } }) => setReason(value)}
            >
              {type
                ? (BALANCE_CHANGE_OPERATIONS[type]('crypto').reasons ?? []).map(
                    reason => (
                      <MenuItem key={reason} value={reason}>
                        {reason}
                      </MenuItem>
                    ),
                  )
                : null}
            </Select>
          </FormControl>
        </>,
      ]}
    />
  )
}

export default React.memo(BulkBalanceAddRoute)
