import React from 'react'

import { DialogLoader } from 'app/dialogs/DialogLoader'

const LazyNotificationsDialog = React.lazy(() =>
  import('./NotificationsDialog').then(({ NotificationsDialog }) => ({
    default: NotificationsDialog,
  })),
)

export const NotificationsDialog = props => (
  <DialogLoader>
    <LazyNotificationsDialog {...props} />
  </DialogLoader>
)
