import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazyRoowardsDialog = React.lazy(() =>
  import('./RoowardsDialog').then(({ RoowardsDialog }) => ({
    default: RoowardsDialog,
  })),
)

export const RoowardsDialog = props => (
  <DialogLoader>
    <LazyRoowardsDialog {...props} />
  </DialogLoader>
)
