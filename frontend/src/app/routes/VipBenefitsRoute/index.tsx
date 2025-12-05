import React from 'react'

import { asLazyRoute } from 'app/util'

export const VipBenefitsRoute = React.lazy(() =>
  asLazyRoute(
    import('./VipBenefitsRoute').then(({ VipBenefitsRoute }) => ({
      default: VipBenefitsRoute,
    })),
  ),
)
