import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyLocaleDialog = React.lazy(() =>
  import('./LocaleDialog').then(({ LocaleDialog }) => ({
    default: LocaleDialog,
  })),
)

export const LocaleDialog = props => (
  <DialogLoader>
    <LazyLocaleDialog {...props} />
  </DialogLoader>
)
