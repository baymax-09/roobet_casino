import React from 'react'
import { type AxiosRequestConfig } from 'axios'

import { api } from 'common/util'

export interface AxiosPostOptions<TData, TVars> {
  method?: 'post' | 'patch'
  variables?: TVars
  onCompleted?: (data: TData) => void
  onError?: (error: Error) => void
  /** For setting headers, etc */
  config?: AxiosRequestConfig
}

export const useAxiosPost = <TData, TVars>(
  path: string,
  options: AxiosPostOptions<TData, TVars> = {},
): [
  (options?: AxiosPostOptions<TData, TVars>) => void,
  { loading: boolean; error: any },
] => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const pathRef = React.useRef(path)
  const optionsRef = React.useRef({
    ...options,
  })

  // Clear the ref on dismount, or callbacks can cause memory leaks.
  React.useEffect(() => {
    return () => {
      optionsRef.current = {}
    }
  }, [])

  const mutationFn = React.useCallback(
    (options?: AxiosPostOptions<TData, TVars>) => {
      setLoading(true)

      const method = options?.method ?? optionsRef.current?.method ?? 'post'
      const variables =
        options?.variables || optionsRef.current.variables || null

      api[method]<any, TData>(
        pathRef.current,
        variables,
        optionsRef.current.config,
      )
        .then(data => {
          if (typeof optionsRef.current.onCompleted === 'function') {
            optionsRef.current.onCompleted(data)
          }
        })
        .catch(error => {
          setError(error)
          if (typeof optionsRef.current.onError === 'function') {
            optionsRef.current.onError(error)
          } else {
            console.error(error)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [],
  )

  return [mutationFn, { loading, error }]
}
