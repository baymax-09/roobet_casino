import React from 'react'

import { asLazyRoute } from 'app/util'

export const JapanRoute = React.lazy(() => asLazyRoute(import('./JapanRoute')))
