import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyConfirmSignupDialog = React.lazy(() =>
  import('./ConfirmSignupDialog').then(({ ConfirmSignupDialog }) => ({
    default: ConfirmSignupDialog,
  })),
)

export const ConfirmSignupDialog = props => (
  <DialogLoader>
    <LazyConfirmSignupDialog {...props} />
  </DialogLoader>
)
