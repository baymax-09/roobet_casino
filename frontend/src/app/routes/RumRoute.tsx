import React, { useRef } from 'react'
import {
  Route,
  type RouteProps,
  type RouteComponentProps,
} from 'react-router-dom'
import { datadogRum } from '@datadog/browser-rum'
import { type MarkRequired } from 'ts-essentials'

/**
 * This route is to ensure we can get parameterized paths in out Real-User Monitoring
 * system in Datadog. Example: /game/:name instead of /game/pragmatic:vs10tut
 */
export const RumRoute: React.FC<MarkRequired<RouteProps, 'component'>> = ({
  component,
  ...otherProps
}) => {
  const RumComponent = React.useMemo(() => {
    return withRum(component)
  }, [component])

  return <Route {...otherProps} component={RumComponent} />
}

const withRum = (component: Exclude<RouteProps['component'], undefined>) =>
  function RumView(props: RouteComponentProps) {
    useRef(
      (() => {
        if (datadogRum.getInitConfiguration()?.trackViewsManually) {
          datadogRum.startView(props.match.path)
        } else {
          console.warn(
            '@datadog/rum-react-integration: The trackViewsManually flag in RUM initialization must be set to %ctrue%c.',
            'color:green',
            'color:default',
          )
        }
      })(),
    )

    const Component = component
    return <Component {...props} />
  }
