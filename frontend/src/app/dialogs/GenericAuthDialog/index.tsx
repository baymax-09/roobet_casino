import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyGenericAuthDialog = React.lazy(() =>
  import('./GenericAuthDialog').then(({ GenericAuthDialog }) => ({
    default: GenericAuthDialog,
  })),
)

export const GenericAuthDialog = props => (
  <DialogLoader>
    <LazyGenericAuthDialog {...props} />
  </DialogLoader>
)
