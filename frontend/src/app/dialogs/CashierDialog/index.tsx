import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyCashierDialog = React.lazy(() =>
  import(/* webpackPrefetch: true */ './CashierDialog').then(
    ({ CashierDialog }) => ({
      default: CashierDialog,
    }),
  ),
)

export const CashierDialog = props => (
  <DialogLoader>
    <LazyCashierDialog {...props} />
  </DialogLoader>
)
