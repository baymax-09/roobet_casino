import { runWorker } from 'src/util/workerRunner'
import { io } from 'src/system'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'

import { IO_MESSAGE_NEW } from '../constants'
import { getMessage } from '../documents'
import { scopedLogger } from 'src/system/logger'

const messagingLogger = scopedLogger('messaging')

export interface EmitScheduledMessageParams {
  messageId: string
}

export const EMIT_SCHEDULED_MESSAGE_TOPIC = 'messagingEmitScheduledMessage'

const handler = async ({ messageId }: EmitScheduledMessageParams) => {
  const logger = messagingLogger('handler', { userId: null })
  logger.info(
    `Messaging emit scheduled queue receieved message: ${messageId}`,
    { messageId },
  )

  try {
    const message = await getMessage(messageId)

    if (!message?.recipients) {
      return
    }

    if (message.recipients.length === 0) {
      // Emit to all open connections.
      io.emit(IO_MESSAGE_NEW, message)
    } else {
      // Emit to only receipients.
      for (const userId of message.recipients) {
        io.to(userId).emit(IO_MESSAGE_NEW, message)
      }
    }
    logger.info(`Messaging emit scheduled sent socket message ${messageId}`, {
      message,
    })
  } catch (error) {
    logger.error(
      `Error emitting scheduled message - ${error.message}`,
      { messageId },
      error,
    )
  }
}

const start = async () => {
  messagingLogger('start', { userId: null }).info(
    'Starting messageEmitScheduledMessage worker.',
  )
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.scheduledEvents',
    queue: EMIT_SCHEDULED_MESSAGE_TOPIC,
    handler,
  })
}

export const run = async () => {
  runWorker('emitScheduledMessage', start)
}
