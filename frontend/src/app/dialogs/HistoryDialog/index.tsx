import React from 'react'

import { DialogLoader } from '../DialogLoader'

const LazyHistoryDialog = React.lazy(() => import('./HistoryDialog'))
const LazyHistoryDetailsDialog = React.lazy(
  () => import('./HistoryDetailsDialog'),
)

export const HistoryDialog = props => (
  <DialogLoader>
    <LazyHistoryDialog {...props} />
  </DialogLoader>
)

export const HistoryDetailsDialog = props => (
  <DialogLoader>
    <LazyHistoryDetailsDialog {...props} />
  </DialogLoader>
)

export { default as HistoryTable } from './HistoryTable'
