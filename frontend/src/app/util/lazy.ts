import React from 'react'

import { useLazyRoute } from 'app/hooks'

export const asLazyRoute = promise =>
  promise.then(({ default: component }) => ({
    default: function LazyRoute(props) {
      // Hide full page loading overlay after route had loaded.
      useLazyRoute(true)

      return React.createElement(component, props)
    },
  }))
