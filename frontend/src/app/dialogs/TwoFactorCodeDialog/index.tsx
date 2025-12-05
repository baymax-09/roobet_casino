import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyTwoFactorCodeDialog = React.lazy(() =>
  import('./TwoFactorCodeDialog').then(({ TwoFactorCodeDialog }) => ({
    default: TwoFactorCodeDialog,
  })),
)

export const TwoFactorCodeDialog = props => (
  <DialogLoader>
    <LazyTwoFactorCodeDialog {...props} />
  </DialogLoader>
)
