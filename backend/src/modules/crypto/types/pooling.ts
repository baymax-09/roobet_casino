import { type IOResult } from './util'

export enum PoolingQueuePriority {
  POOL_PRIORITY = 1,
  FINAL_POOL_PRIORITY = 2,
}

export class PoolingError extends Error {
  code?: number

  constructor(message: string, code = 99999) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export type PoolingTokensReturn<T> = IOResult<
  { tokensPooled: T[] },
  PoolingError
>

export interface PoolingWorkerHooks<T> {
  tokensToPool: () => Promise<T[]>
  poolTokens: (tokensToPool: T[]) => Promise<PoolingTokensReturn<T>>
}
