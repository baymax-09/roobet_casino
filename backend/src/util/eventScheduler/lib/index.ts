import { publishScheduledEvent } from '../rabbitmq'
import { type ScheduledEvent } from '../documents/scheduledEvents'
import { completeScheduledEvent } from '../documents/scheduledEvents'

export interface ScheduledEventPayload<Params extends Record<string, any>> {
  eventId: string
  params: Params
}

export const triggerScheduledEvent = async ({
  _id,
  topic,
  params,
}: ScheduledEvent) => {
  const eventId = _id.toString()
  await publishScheduledEvent({ queue: topic, payload: params })
  await completeScheduledEvent(eventId)
}
