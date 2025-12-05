declare module 'redis-timeseries' {
  interface GranularityConfig {
    ttl: number
    duration: number
  }
  export type Granularities = Record<string, GranularityConfig>
  export type TimeseriesData = Array<[number, number]>
  type TimeseriesCallback = (err: Error, data: TimeseriesData) => void

  class TimeSeries {
    constructor(redis: any, keyBase: string, granularities: Granularities)
    recordHit(key: string, timestamp: number, increment: number): TimeSeries
    removeHit(key: string, timestamp: number, decrement: number): TimeSeries
    exec(callback: TimeseriesCallback): void
    getHits(
      key: string,
      gran: any,
      count: number,
      callback: TimeseriesCallback,
    ): void
  }

  export = TimeSeries
}
