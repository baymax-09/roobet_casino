import React from 'react'
import {
  matchPath,
  type RouteComponentProps as ReactRouterRouteComponentProps,
} from 'react-router'

export class LazyRouteTimeoutError extends Error {}

export const isPathEqual = (first, second) =>
  first?.location.pathname === second?.location.pathname
export const isSearchEqual = (first, second) =>
  first?.location.search === second?.location.search

type RouteChild = React.ReactElement<{ path?: string; from?: string }>
export type RouteChildren = Array<RouteChild | RouteChild[]>

const findMatchingRoute = (
  current: ReactRouterRouteComponentProps,
  routes: RouteChildren,
  callback = matchingElement => undefined,
) => {
  let match

  // We use React.Children.forEach instead of React.Children.toArray().find()
  // here because toArray adds keys to all child elements and we do not want
  // to trigger an unmount/remount for two <Route>s that render the same
  // component at different URLs.
  React.Children.forEach(routes, child => {
    if (!match && React.isValidElement(child)) {
      const path = child.props.path || child.props.from

      match = path
        ? matchPath(current?.location.pathname, { ...child.props, path })
        : current?.match

      if (match) {
        callback(child)
      }
    }
  })

  return match
}

export const findMatchingElement = (
  current: ReactRouterRouteComponentProps,
  routes: RouteChildren,
) => {
  let element

  const match = findMatchingRoute(current, routes, matchingElement => {
    element = matchingElement
  })

  return match
    ? React.cloneElement(element, {
        location: current?.location,
        computedMatch: match,
      })
    : null
}
