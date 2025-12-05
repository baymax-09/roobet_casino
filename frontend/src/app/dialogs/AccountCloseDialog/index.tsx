import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyAccountCloseDialog = React.lazy(() =>
  import('./AccountCloseDialog').then(({ AccountCloseDialog }) => ({
    default: AccountCloseDialog,
  })),
)

export const AccountCloseDialog = props => (
  <DialogLoader>
    <LazyAccountCloseDialog {...props} />
  </DialogLoader>
)
