import * as Prometheus from 'prom-client'

export interface InstrumentorControl {
  start: (
    startLabels?: Prometheus.LabelValues<string>,
  ) => (endLabels?: Prometheus.LabelValues<string>, queryString?: any) => void
}

export const TransactionInstrumentor = (
  transactionName: string,
  threshold: number,
): InstrumentorControl => {
  const requestsExceedThresholdCounter = new Prometheus.Counter({
    name: `${transactionName}_requests_exceed_threshold_count`,
    help: `This is the number of ${transactionName} queries that have exceeded a time threshold`,
  })

  const requestsCounter = new Prometheus.Counter({
    name: `${transactionName}_requests_count`,
    help: `This is the number of ${transactionName} queries`,
  })

  const totalRequestTimeHistogram = new Prometheus.Histogram({
    name: `${transactionName}_total_request_times`,
    help: `This is a histogram for ${transactionName} query times`,
    buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
  })

  return {
    start: startLabels => {
      const stopActiveTimer = totalRequestTimeHistogram.startTimer(startLabels)

      return (endLabels, queryString) => {
        const totalRequestTime = stopActiveTimer(endLabels)
        requestsCounter.inc()
        if (threshold < totalRequestTime) {
          requestsExceedThresholdCounter.inc()
        }
      }
    },
  }
}
