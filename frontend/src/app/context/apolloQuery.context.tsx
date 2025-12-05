import React, { createContext, useContext } from 'react'
import {
  type ApolloQueryResult,
  type OperationVariables,
  useQuery,
} from '@apollo/client'

interface QueryResult<TData> {
  data?: TData
  error?: any
  loading: boolean
}

interface QueryContextValue<TData> {
  queryData: QueryResult<TData>
  refetch: () => Promise<ApolloQueryResult<TData>>
}

const QueryResultContext = createContext<QueryContextValue<any>>({
  queryData: { loading: true },
  // Mocked refetch function that returns a resolved promise
  refetch: () =>
    Promise.resolve({
      data: {},
      loading: false,
      networkStatus: 7, // Ready
      stale: false,
    }),
})

interface QueryResultProviderProps<
  TVariables extends OperationVariables | undefined = object,
> {
  query: any
  variables?: TVariables
  children: React.ReactNode
}

// In the future, this could be modified to accept multiple queries for additional preloading
export const ApolloQueryResultProvider = ({
  query,
  variables,
  children,
}: QueryResultProviderProps) => {
  const { data, error, loading, refetch } = useQuery(query, {
    variables,
    fetchPolicy: 'cache-and-network',
  })
  const value = { queryData: { data, error, loading }, refetch }
  return (
    <QueryResultContext.Provider value={value}>
      {children}
    </QueryResultContext.Provider>
  )
}

export const useApolloQueryResult = <TData = any,>(): QueryResult<TData> => {
  const context = useContext(QueryResultContext)
  if (!context) {
    throw new Error('useQueryResult must be used within a QueryResultProvider')
  }
  return context.queryData
}
