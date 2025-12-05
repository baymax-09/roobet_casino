import { type Options } from 'amqplib'

export interface MessageOptions extends Options.Publish {
  persistent: boolean
  headers: {
    cc: string
  }
  type: string
}
