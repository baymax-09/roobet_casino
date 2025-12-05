import React from 'react'
import { datadogRum } from '@datadog/browser-rum'

export class ErrorBoundaryBubbleError extends Error {}

interface ErrorBoundaryFallbackParams {
  prevLocation: string
}

export type ErrorBoundaryFallback = React.FunctionComponent<
  Partial<ErrorBoundaryFallbackParams> & {
    recover: () => void
    error: boolean
  }
>

type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback: ErrorBoundaryFallback
  params?: ErrorBoundaryFallbackParams
  // TODO what should this be?
  scope: string
}>

interface ErrorBoundaryState {
  error: boolean
  hasRecoveredOnce: boolean
}

// Error boundaries must be class components.
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state = { error: false, hasRecoveredOnce: false }
  fallback: ErrorBoundaryFallback

  static defaultProps = {
    scope: 'error-boundary',
  }

  constructor(props) {
    super(props)

    const { fallback } = props

    if (!fallback) {
      throw new Error('An error boundary requires a fallback component.')
    }

    this.fallback = fallback
  }

  static getDerivedStateFromError() {
    return { error: true }
  }

  override componentDidCatch(error) {
    if (datadogRum) {
      datadogRum.addError(error, { scope: this.props.scope })
    }

    // Bubble up error to next boundary.
    if (error instanceof ErrorBoundaryBubbleError) {
      throw error
    }
  }

  recover = () => {
    this.setState({ error: false, hasRecoveredOnce: true })
  }

  override render() {
    if (this.state.error) {
      if (this.state.hasRecoveredOnce) {
        throw new Error(
          'ErrorBoundary caught a second error after initially recovering.',
        )
      }

      return React.createElement(this.fallback, {
        recover: this.recover,
        error: this.state.error,
        ...(this.props.params ?? {}),
      })
    }

    return this.props.children
  }
}
