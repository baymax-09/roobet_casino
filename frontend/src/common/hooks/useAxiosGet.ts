import React from 'react'

import { api } from 'common/util'

interface AxiosGetOptions<TData, TVars> {
  onCompleted?: (data: TData) => void
  onError?: (error: any) => void
  lazy?: boolean
  skip?: boolean
  params?: TVars
}

type CallFunc<TVars> = (callParams?: TVars) => void
type AxiosGetReturn<TData, TVars> = [
  { loading: boolean; data: TData | null; error: any },
  CallFunc<TVars>,
]

/**
 * @todo right now changing path will trigger a refetch, to make this match Apollo useQuery,
 * we may want to require explicit refetch.
 */
export const useAxiosGet = <TData, TVars = null>(
  path: string,
  options: AxiosGetOptions<TData, TVars> = {},
): AxiosGetReturn<TData, TVars> => {
  const optionsRef = React.useRef({
    ...options,
  })

  const [data, setData] = React.useState<TData | null>(null)
  const [loading, setLoading] = React.useState(
    !optionsRef.current.lazy && !options.skip,
  )
  const [error, setError] = React.useState(null)

  // Clear the ref on dismount, or callbacks can cause memory leaks.
  React.useEffect(() => {
    return () => {
      optionsRef.current = {}
    }
  }, [])

  const call = React.useCallback(
    (callParams?: TVars) => {
      setLoading(true)
      const params = callParams || optionsRef.current.params || null
      const apiOptions = params ? { params } : undefined

      return api
        .get<TData, TData>(path, apiOptions)
        .then(data => {
          setData(data)

          if (typeof optionsRef.current.onCompleted === 'function') {
            optionsRef.current.onCompleted(data)
          }

          return data
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
    [path],
  )

  React.useEffect(() => {
    // Not using optionsRef for skip so it is up-to-date
    if (!optionsRef.current.lazy && !options.skip) {
      call()
    }
  }, [call, options.skip])

  return [{ loading, error, data }, call]
}
