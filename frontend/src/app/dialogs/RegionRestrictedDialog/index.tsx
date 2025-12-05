import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazyRegionRestrictedDialog = React.lazy(() =>
  import('./RegionRestrictedDialog').then(({ RegionRestrictedDialog }) => ({
    default: RegionRestrictedDialog,
  })),
)

export const RegionRestrictedDialog = props => (
  <DialogLoader>
    <LazyRegionRestrictedDialog {...props} />
  </DialogLoader>
)
