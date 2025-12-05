const Prometheus = jest.genMockFromModule("prom-client")
Prometheus.Histogram = class Histogram {
  constructor () {}
  startTimer () {
    return () => 5
  }
}

module.exports = Prometheus
