import moment from 'moment'
import TimeSeries, { type TimeseriesData } from 'redis-timeseries'
import { TransactionInstrumentor } from 'src/util/instrumentation'

import { config, redis } from 'src/system'

const GRANULARITIES = {
  '1second': { ttl: 5 * 60, duration: 1 },
  '1minute': { ttl: 1 * 60 * 60, duration: 1 * 60 },
  '5minutes': { ttl: 1 * 60 * 60 * 24, duration: 5 * 60 },
  '10minutes': { ttl: 1 * 60 * 60 * 24, duration: 10 * 60 },
  '1hour': { ttl: 1 * 60 * 60 * 24 * 7, duration: 60 * 60 },
  '1day': { ttl: 1 * 60 * 60 * 24 * 7 * 52, duration: 60 * 60 * 24 },
}
type Granularity = keyof typeof GRANULARITIES

const ts = new TimeSeries(redis, 'timeseries', GRANULARITIES)

const instrumentRecord = TransactionInstrumentor('redis_timeSeries_record', 100)
const instrumentSummation = TransactionInstrumentor(
  'redis_timeSeries_summation',
  100,
)

/**
 * @param isMoney is true if its dealing with monetary stuff - we can only go to a certain precision
 * @note the timeseries module cant store numbers < 1
 */
export async function recordTimeseries(
  key: string,
  amount: number | undefined = 0,
  isMoney = true,
): Promise<TimeseriesData> {
  const amountToRecord = isMoney
    ? amount * Math.pow(10, config.balanceDecimalPlaces)
    : amount
  const timestamp = moment().unix()
  return await new Promise<TimeseriesData>((resolve, reject) => {
    const instrumentRecordEnd = instrumentRecord.start()
    ts.recordHit(key, timestamp, amountToRecord).exec((err, data) => {
      err ? reject(err) : resolve(data)
    })
    instrumentRecordEnd()
  })
}

/**
 * @param isMoney is true if its dealing with monetary stuff - we can only go to a certain precision
 * @note the timeseries module cannot store numbers < 1
 * @note data = [ [ts1, count1], [ts2, count2]... ]
 */
export async function getTimeseriesSummation(
  key: string,
  granularity: Granularity,
  count = 10,
  isMoney = false,
): Promise<number> {
  const counts = await new Promise<TimeseriesData>((resolve, reject) => {
    const instrumentSummationEnd = instrumentSummation.start()
    ts.getHits(key, granularity, count, (err, data) => {
      err ? reject(err) : resolve(data)
    })
    instrumentSummationEnd()
  })
  const summation = counts.reduce((sum, tuple) => sum + tuple[1], 0)
  if (isMoney) {
    return summation / Math.pow(10, config.balanceDecimalPlaces)
  }
  return summation
}
