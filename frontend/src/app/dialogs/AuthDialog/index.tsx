import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyAuthDialog = React.lazy(() =>
  import(/* webpackPrefetch: true */ './AuthDialog').then(({ AuthDialog }) => ({
    default: AuthDialog,
  })),
)

export { AuthDialogField } from './AuthDialogField'

export const AuthDialog = props => (
  <DialogLoader>
    <LazyAuthDialog {...props} />
  </DialogLoader>
)
