import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyRedeemCodeDialog = React.lazy(() =>
  import(/* webpackPrefetch: true */ './RedeemDialog').then(
    ({ RedeemDialog }) => ({
      default: RedeemDialog,
    }),
  ),
)

export const RedeemDialog = props => (
  <DialogLoader>
    <LazyRedeemCodeDialog {...props} />
  </DialogLoader>
)
