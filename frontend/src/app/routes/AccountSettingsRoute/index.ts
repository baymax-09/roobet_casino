import React from 'react'

import { asLazyRoute } from 'app/util'

export const AccountSettingsRoute = React.lazy(() =>
  asLazyRoute(import('./AccountSettingsRoute')),
)
