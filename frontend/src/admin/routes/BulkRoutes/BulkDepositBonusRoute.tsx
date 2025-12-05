import React from 'react'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'
import { withRulesAccessController } from 'admin/components'

import { exampleDepositBonusData } from './BulkExampleData'

const columns = withUserIdOrName([
  {
    name: 'bonusType',
    label: 'Bonus Type (Fixed or Percent Match)',
    type: 'string',
  },
  {
    name: 'maxMatch',
    label: 'Max Match',
    type: 'number',
  },
  {
    name: 'percentMatch',
    label: 'Percent Match',
    type: 'number',
  },
  {
    name: 'fixedAmount',
    label: 'Fixed Amount',
    type: 'number',
  },
  {
    name: 'minDeposit',
    label: 'Min Deposit (Optional)',
    type: 'number',
  },
  {
    name: 'expirationDate',
    label: 'Expiration Date (Optional)',
    type: 'date',
  },
  {
    name: 'wagerRequirementMultiplier',
    label: 'Wager Requirement Multiplier (Optional)',
    type: 'number',
  },
  {
    name: 'reason',
    label: 'Reason',
    type: 'string',
  },
  {
    name: 'override',
    label: 'Override',
  },
])

const AccessBulkActions = withRulesAccessController(
  ['deposit_bonus:create_bulk'],
  BulkActions,
)
const copyOptions = {
  exampleData: exampleDepositBonusData,
}

const BulkDepositBonusRoute: React.FC = () => {
  return (
    <AccessBulkActions
      id="deposit-bonus"
      title="Deposit Bonus"
      endpoint="/promo/admin/addMatchPromoBulk"
      columns={columns}
      copy={copyOptions}
    />
  )
}

export default React.memo(BulkDepositBonusRoute)
