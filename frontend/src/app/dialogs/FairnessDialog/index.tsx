import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyFairnessDialog = React.lazy(() =>
  import('./FairnessDialog').then(({ FairnessDialog }) => ({
    default: FairnessDialog,
  })),
)

export const FairnessDialog = props => (
  <DialogLoader>
    <LazyFairnessDialog {...props} />
  </DialogLoader>
)
