import React from 'react'

import { BulkActions, withRulesAccessController } from 'admin/components'

import { examplePromoCodeData } from './BulkExampleData'

const AccessBulkActions = withRulesAccessController(
  ['promos:create_bulk'],
  BulkActions,
)
const copyOptions = {
  exampleData: examplePromoCodeData,
  instructions: [
    'Creating Promo Codes: Ensure that as many columns as needed are filled in. You may receive errors if done incorrectly.',
    'Expiring Promo Codes: You only need 2 columns, "code" and "expiresTime". Set "expiresTime" to 0 to expire a code properly. ',
  ],
}

const BulkPromosRoute: React.FC = () => {
  return (
    <AccessBulkActions
      id="promo-codes"
      title="Promo Codes"
      endpoint="/promo/admin/addCodesBulk"
      copy={copyOptions}
      ignoreAllColumnsFilled={true}
      columns={[
        {
          name: 'claimAmount',
          label: 'Claim Amount',
          type: 'string',
        },
        {
          name: 'roowardsBonus',
          label: 'Roowards Bonus',
          type: 'string',
        },
        {
          name: 'claimsRemaining',
          label: 'Claims Remaining',
          type: 'string',
        },
        {
          name: 'expireTime',
          label: 'Expire Time (hours)',
          type: 'string',
        },
        {
          name: 'code',
          label: 'Code',
          type: 'string',
        },
        {
          name: 'balanceType',
          label: 'Balance Type',
          type: 'string',
        },
        {
          name: 'hasNotDeposited',
          label: 'Has Not Deposited',
          type: 'string',
        },
        {
          name: 'mustBeAffiliated',
          label: 'Must Be Affiliated',
          type: 'string',
        },
        {
          name: 'depositCountAmount',
          label: 'Deposit Count - Amount',
          type: 'number',
        },
        {
          name: 'depositCountHours',
          label: 'Deposit Count - Hours',
          type: 'number',
        },
        {
          name: 'depositLimitHours',
          label: 'Deposit Limit - Hours',
          type: 'number',
        },
        {
          name: 'depositLimitAmount',
          label: 'Deposit Limit - Amount',
          type: 'number',
        },
        {
          name: 'wagerLimitHours',
          label: 'Wager Limit - Hours',
          type: 'number',
        },
        {
          name: 'wagerLimitAmount',
          label: 'Wager Limit - Amount',
          type: 'number',
        },
        {
          name: 'affiliateName',
          label: 'Affiliate Name',
          type: 'string',
        },
        {
          name: 'cxAffId',
          label: 'Cellxpert Affiliate ID',
          type: 'string',
        },
      ]}
    />
  )
}

export default React.memo(BulkPromosRoute)
