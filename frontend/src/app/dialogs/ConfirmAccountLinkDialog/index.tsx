import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyConfirmAccountLinkDialog = React.lazy(() =>
  import('./ConfirmAccountLinkDialog').then(({ ConfirmAccountLinkDialog }) => ({
    default: ConfirmAccountLinkDialog,
  })),
)

export const ConfirmAccountLinkDialog = props => (
  <DialogLoader>
    <LazyConfirmAccountLinkDialog {...props} />
  </DialogLoader>
)
