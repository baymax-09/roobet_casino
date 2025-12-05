import { connect, type Connection, type ConfirmChannel } from 'amqplib'
import { config } from 'src/system'
import { createEmitter, type Emitter } from 'src/util/emitter'
import { type ExchangeName, type RoutingKey } from 'src/util/rabbitmq'
import { instrumentRMQChannel } from 'src/util/trace'

import { scopedLogger } from './logger'

interface ConnectionEventMap {
  ready: Connection
  failed: any
  close: never
  error: any
}

type RMQConnectionEmitter = Emitter<ConnectionEventMap>
export type ConnectionType = 'producer' | 'consumer'

const connections: Record<ConnectionType, Connection | null> = {
  producer: null,
  consumer: null,
}
const connRetries: Record<ConnectionType, number> = { producer: 0, consumer: 0 }
const channels: Record<
  ConnectionType,
  Record<string, ConfirmChannel | null> | null
> = {
  producer: null,
  consumer: null,
}

const rabbitLogger = scopedLogger('rabbitmq')

const RMQRetryMutex = new (class {
  private counter = 0
  private readonly waiting: Array<(value: unknown) => void> = []
  private readonly max: number = 1

  public async acquire(): Promise<unknown> {
    if (this.counter < this.max) {
      this.counter += 1
      return await new Promise(resolve => {
        resolve(undefined)
      })
    }

    return await new Promise(resolve => {
      this.waiting.push(resolve)
    })
  }

  public release(): void {
    this.counter -= 1

    if (this.waiting.length > 0 && this.counter < this.max) {
      this.counter += 1
      const resolve = this.waiting.shift()

      if (resolve) {
        resolve(undefined)
      }
    }
  }
})()

const clearChannels = (connectionType: ConnectionType) => {
  if (channels[connectionType]) {
    for (const channel in channels[connectionType]) {
      channels[connectionType]![channel] = null
    }
  }
}

const createConnection = async (connectionType: ConnectionType) => {
  const opts = {}
  scopedLogger('system/rabbitmq')('createConnection', { userId: null }).debug(
    `Creating connection ${connectionType}`,
    { connectionType },
  )
  const connection = await connect(
    config.rabbitmq[connectionType].uri +
      `?heartbeat=${config.rabbitmq.heartbeat}`,
    opts,
  )

  clearChannels(connectionType)
  return connection
}

const retryConnection = async (
  connectionType: ConnectionType,
  {
    after,
    emitter,
    error,
  }: {
    after: keyof ConnectionEventMap
    emitter: RMQConnectionEmitter
    error?: unknown
  },
) => {
  const logger = rabbitLogger('retryConnection', { userId: null })

  // In the case there is a connection issue, .close will throw- trash the error.
  connections[connectionType]?.close().catch()

  connections[connectionType] = null
  logger.error('attempting to reconnect...', { connectionType, after, error })

  // Reconnect if the connection closes
  setTimeout(async () => {
    await getRabbitMQConnection(connectionType, emitter)
    logger.debug('timeout triggered, reconnecting...', {
      connectionType,
      after,
      error,
    })
  }, 2000) // retry connection in 2 seconds
}

export const getRabbitMQConnection = async (
  connectionType: ConnectionType,
  previousEmitter?: RMQConnectionEmitter,
) => {
  const logger = rabbitLogger('getRabbitMQConnection', { userId: null })
  await RMQRetryMutex.acquire()
  logger.debug('mutex lock acquired', { connectionType })
  const emitter = previousEmitter ?? createEmitter<RMQConnectionEmitter>()

  try {
    if (!connections[connectionType]) {
      const connection = await createConnection(connectionType)

      connection.on('ready', () => {
        logger.debug('connection is ready', { connectionType })
        setTimeout(() => {
          connRetries[connectionType] = 0
        }, 60000)
      })

      connection.on('error', error => {
        logger.error('connection error', { connectionType })
        emitter.emit('error', error)
        retryConnection(connectionType, {
          after: 'error',
          emitter,
          error,
        })
      })

      connection.on('close', () => {
        logger.debug('connection is closed', { connectionType })
        emitter.emit('close')
        retryConnection(connectionType, {
          after: 'close',
          emitter,
        })
      })

      connections[connectionType] = connection
    }

    setTimeout(() => {
      if (connections[connectionType]) {
        logger.debug('emitting ready', { connectionType })
        emitter.emit('ready', connections[connectionType]!)
      }
    })
  } catch (error) {
    logger.error(
      'unknown error with establishing a connection',
      { connectionType },
      error,
    )
    emitter.emit('failed', error)
    retryConnection(connectionType, {
      after: 'failed',
      emitter,
      error,
    })
  } finally {
    connRetries[connectionType]++
    RMQRetryMutex.release()
  }

  return emitter
}

export const getRabbitMQChannel = async (
  connectionType: ConnectionType,
  routingKey: RoutingKey<ExchangeName>,
) => {
  const logger = rabbitLogger('getRabbitMQChannel', { userId: null })
  let channel = null
  const connection = connections[connectionType]

  if (!connection) {
    logger.error('Unable to create channel - missing connection', {
      connectionType,
      routingKey,
    })
    return channel
  }

  if (!channels[connectionType]) {
    logger.error(
      'Unable to create channel - missing channel for connectionType',
      { connectionType, routingKey },
    )
    channels[connectionType] = {}
  }

  if (!channels[connectionType]?.[routingKey]) {
    logger.debug('Attempting to create new channel...', {
      connectionType,
      routingKey,
    })
    channel = await connection.createConfirmChannel()
    channels[connectionType]![routingKey] = channel
    logger.debug('New channel created', { connectionType, routingKey })
  } else {
    logger.debug('Channel already exists', {
      connectionType,
      routingKey,
    })
    channel = channels[connectionType]![routingKey]
  }

  if (channel) {
    return instrumentRMQChannel(channel)
  }
  return channel
}

export const rabbitMQHealthCheck = async () => {
  const logger = rabbitLogger('rabbitMQHealthCheck', { userId: null })
  try {
    const result = {
      rabbitMQHealth: !(
        (!connections.producer && connRetries.producer > 5) ||
        (!connections.consumer && connRetries.consumer > 5)
      ),
    }
    return result
  } catch (error) {
    logger.error('unknown error during health', {}, error)
    if (error instanceof Error && 'message' in error) {
      return { rabbitMQHealth: error.message }
    } else {
      return { rabbitMQHealthCheck: false }
    }
  }
}
