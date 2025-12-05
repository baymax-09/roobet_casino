import tracer from 'dd-trace'
import * as otel from '@opentelemetry/api'
// This the only place we want to import Winston directly.
// eslint-disable-next-line no-restricted-imports
import WinstonLib, { format } from 'winston'
import util from 'util'

import { config } from 'src/system/config'

// TODO AS check that this and logInjection: true aren't conflicting
// Ensure the proper trace information gets injected into the logs
const tracerFormat = format(info => {
  const otelSpan = otel.trace.getSpan(otel.context.active())
  if (otelSpan && (otelSpan.spanContext() as any)._ddContext._parentId) {
    const { spanId, traceId } = otelSpan.spanContext()
    const traceIdEnd = traceId.slice(traceId.length / 2)
    info['dd.trace_id'] = BigInt(`0x${traceIdEnd}`).toString()
    info['dd.span_id'] = BigInt(`0x${spanId}`).toString()
  }
  const ddSpan = tracer.scope().active()
  if (ddSpan) {
    info.dd.service = (ddSpan.context() as any)._tags.service
  }
  return info
})

/**
 * @deprecated use scopedLogger for logging
 * @todo AS remove export and deprecated tag at same time.
 */
export const winston = WinstonLib.createLogger({
  level: config.logLevel,
  format: config.isLocal
    ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, metadata }) => {
          // Using util.format so that developers don't have to read inline JSON
          const metadataString = util.format(metadata)
          const formattedMetadata = ['undefined', '{}'].includes(metadataString)
            ? undefined
            : '| Metadata: ' + metadataString
          return [timestamp, level, message, formattedMetadata]
            .filter(value => !!value)
            .join(' ')
        }),
      )
    : format.combine(
        tracerFormat(),
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
  transports: [new WinstonLib.transports.Console()],
})

winston.on('error', err => {
  // eslint-disable-next-line no-console
  console.error('Winston error', err)
})

/** @todo AS remove when we are longer directly exporting Winston. */
const joiner = (args: any) => {
  const newArgs = { metadata: {} }
  const message = []
  let arrayCount = 0

  for (const arg of args) {
    if (typeof arg === 'string' || arg instanceof String) {
      message.push(arg)
    } else if (typeof arg === 'number') {
      message.push(arg)
    } else if (arg && arg.stack) {
      message.push(arg.stack)
    } else if (typeof arg === 'object' && !Array.isArray(arg)) {
      newArgs.metadata = { ...newArgs.metadata, ...arg }
    } else if (Array.isArray(arg)) {
      newArgs.metadata = { ...newArgs.metadata, ['array_' + arrayCount]: arg }
      arrayCount += 1
    } else if (typeof arg === 'function' || arg === undefined) {
      continue
    } else {
      newArgs.metadata = { ...newArgs.metadata, unsupported_arg: arg }
    }
  }

  if (message.length === 0) {
    if (args && args.message) {
      message.push(args.message)
    }
  }

  if (Object.keys(newArgs.metadata).length > 0) {
    return [message.join(' '), newArgs]
  } else {
    return [message.join(' '), {}]
  }
}

// TODO AS remove when we no longer directly export Winston
const wrap =
  (original: (...args: any[]) => any) =>
  (...args: any[]) =>
    original(...joiner(args))
const WinstonSeverities = [
  'error',
  'warn',
  'info',
  'verbose',
  'debug',
  'silly',
] as const
export type WinstonSeverity = (typeof WinstonSeverities)[number]

export interface LoggerContext {
  userId: string | null
  ip?: string
  countryCode?: string
  path?: string
}
interface ExtendedLoggerContext extends LoggerContext {
  module: string
  scope: string
}
type WinstonMetadata = Record<string, any> & { userId?: never }

// TODO AS remove when no longer directly exporting Winston
// Since we overwrite the Winston logger functions, we need to cache them for our scoped logger factory
const cachedWinstonSeverityFns = Object.fromEntries(
  WinstonSeverities.map(severity => [
    severity,
    winston[severity].bind(winston),
  ]),
)

class BaseLogger {
  private readonly context: ExtendedLoggerContext
  constructor(
    private readonly module: string,
    private readonly scope: string,
    baseContext: LoggerContext,
  ) {
    this.context = {
      ...baseContext,
      module,
      scope,
    }
  }

  public log(
    severity: WinstonSeverity,
    message: string,
    metadata: WinstonMetadata = {},
    error?: Error,
  ) {
    const errorMessage = error instanceof Error ? ` ${error.stack}` : ''
    const messageString =
      `${this.module} :: ${this.scope} :: ` + message + errorMessage
    cachedWinstonSeverityFns[severity](messageString, {
      metadata,
      context: this.context,
    })
  }

  public alert(
    monitorKey: string,
    metadata: WinstonMetadata = {},
    error?: Error,
  ) {
    this.log('error', monitorKey, { ...metadata, monitorKey }, error)
  }
}

export type ScopedLogger = BaseLogger &
  Record<
    WinstonSeverity,
    (message: string, metadata?: WinstonMetadata, error?: Error) => ScopedLogger
  >
const InternalLogger = class InternalLogger extends BaseLogger {} as new (
  ...args: ConstructorParameters<typeof BaseLogger>
) => ScopedLogger
// Dynamically add each severity to the Logger prototype
WinstonSeverities.forEach(severity => {
  InternalLogger.prototype[severity] = function (
    this: ScopedLogger,
    message: string,
    metadata: WinstonMetadata = {},
    error?: Error,
  ) {
    this.log(severity, message, metadata, error)
    return this
  }
})

/** @todo this is a module logger, should be renamed. */
export const scopedLogger =
  (moduleName: string) => (scope: string, baseContext: LoggerContext) =>
    new InternalLogger(moduleName, scope, baseContext)
export type ModuleLogger = ReturnType<typeof scopedLogger>

// TODO AS remove when we no longer directly export Winston
for (const severity of WinstonSeverities) {
  winston[severity] = wrap(winston[severity])
}
