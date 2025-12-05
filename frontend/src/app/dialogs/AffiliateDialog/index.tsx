import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyAffiliateDialog = React.lazy(() =>
  import('./AffiliateDialog').then(({ AffiliateDialog }) => ({
    default: AffiliateDialog,
  })),
)

export const AffiliateDialog = props => (
  <DialogLoader>
    <LazyAffiliateDialog {...props} />
  </DialogLoader>
)
