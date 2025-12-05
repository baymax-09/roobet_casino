import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyWalletSettingsDialog = React.lazy(() =>
  import('./WalletSettings').then(({ WalletSettingsDialog }) => ({
    default: WalletSettingsDialog,
  })),
)

export const WalletSettingsDialog = props => (
  <DialogLoader>
    <LazyWalletSettingsDialog {...props} />
  </DialogLoader>
)
