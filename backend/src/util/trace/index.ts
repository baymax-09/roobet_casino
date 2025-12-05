import tracer from 'dd-trace'
import { SERVICE_NAME } from 'dd-trace/ext/tags'
import { type ConfirmChannel, type ConsumeMessage } from 'amqplib'

export function instrument<T>(
  name: string,
  service: string | undefined,
  callback: () => T,
): T {
  return tracer.trace(name, span => {
    if (span && service) {
      span.setTag('service', service)
      span.setTag(SERVICE_NAME, service)
    }
    return callback()
  })
}

export function instrumentRMQChannel(channel: ConfirmChannel) {
  return new Proxy(channel, {
    get(target: ConfirmChannel, prop: keyof ConfirmChannel) {
      if (prop === 'publish') {
        const publish = target[prop]

        return function (
          this: ConfirmChannel,
          ...args: Parameters<ConfirmChannel['publish']>
        ) {
          const operation = 'send'
          const params = args[3]

          return tracer.trace(operation, span => {
            if (span && params) {
              span.addTags(params)
              span.setTag('span.kind', 'producer')
              span.setTag('messaging.operation', operation)
              span.setTag('resource.name', `${params.headers.cc} send`)
            }

            return publish.apply(this, args)
          })
        }
      }

      return target[prop]
    },
  })
}

export async function instrumentRMQMessage<T extends (...args: any) => any>(
  message: ConsumeMessage | null,
  callback: T,
): Promise<ReturnType<T>> {
  const operation = 'process'
  return await tracer.trace(operation, async span => {
    if (span && message) {
      span.addTags({ headers: message.properties.headers })
      span.setTag('span.kind', 'consumer')
      span.setTag('messaging.operation', operation)
      span.setTag('resource.name', `${message.properties.headers.cc} process`)
    }
    return await callback()
  })
}

export async function instrumentRethink<T extends (...args: any) => any>(
  query: string,
  callback: T,
): Promise<ReturnType<T>> {
  return await instrument(query, 'rethinkdb', async () => await callback())
}
