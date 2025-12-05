import tracer from 'dd-trace'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import {
  SocketIoInstrumentation,
  type SocketIoInstrumentationConfig,
} from 'opentelemetry-instrumentation-socket.io'

import { config } from './config'

// initialized in a different file to avoid hoisting.
tracer.init({
  sampleRate: config.datadog.sampleRate,
  // Our traces are not super useful right now, but it is not harmful to enable this locally if you wish.
  // If you want this to always be on locally, make sure you format it nicely in winston.ts.
  logInjection: !config.isLocal,
})

tracer.use('express', {
  // exclude health and metrics endpoints from traces
  blocklist: ['/health', '/metrics'],
})

const socketIO = new SocketIoInstrumentation()
const socketIOConfig: SocketIoInstrumentationConfig = {
  emitHook: function (span, _data) {
    // Set to redis since we only use it for that
    span.setAttribute('service.name', 'redis')
  },
}
socketIO.setConfig(socketIOConfig)

registerInstrumentations({
  instrumentations: [socketIO],
})

const tracerProvider = new tracer.TracerProvider()
tracerProvider.register()
