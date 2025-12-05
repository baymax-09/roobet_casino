import React from 'react'

import { BulkActions, withUserIdOrName } from 'admin/components/BulkActions'

import { exampleUserUpdateData } from './BulkExampleData'

const validRoles = ['vip', 'hv', '']

const columns = withUserIdOrName([
  {
    name: 'role',
    label: 'Role',
    type: 'string',
    options: {
      validate: (value): boolean => {
        return validRoles.includes(value)
      },
    },
  },
  {
    name: 'isSponsor',
    label: 'Is Sponsor',
    type: 'boolean',
  },
  {
    name: 'isMarketing',
    label: 'Is Marketing',
    type: 'boolean',
  },
  {
    name: 'isPromoBanned',
    label: 'Is Promo Banned',
    type: 'boolean',
  },
])

const copyOptions = {
  exampleData: exampleUserUpdateData,
  instructions: ['Role values (vip,hv)'],
}

export const BulkUserUpdateRoute: React.FC = () => {
  return (
    <BulkActions
      id="user-update"
      title="User Update"
      endpoint="/admin/user/updateBulk"
      columns={columns}
      copy={copyOptions}
    />
  )
}
