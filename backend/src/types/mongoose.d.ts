declare module 'mongoose' {
  import {
    type UpdateWithAggregationPipeline,
    type UpdateQuery,
  } from 'mongoose'

  /** Convenience type for our Data Access Layer, could live somewhere else. */
  export type UpdatePayload<T> = UpdateWithAggregationPipeline | UpdateQuery<T>
}
