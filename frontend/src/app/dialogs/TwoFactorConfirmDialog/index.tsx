import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyTwoFactorConfirmDialog = React.lazy(() =>
  import('./TwoFactorConfirmDialog').then(({ TwoFactorConfirmDialog }) => ({
    default: TwoFactorConfirmDialog,
  })),
)

export const TwoFactorConfirmDialog = props => (
  <DialogLoader>
    <LazyTwoFactorConfirmDialog {...props} />
  </DialogLoader>
)
