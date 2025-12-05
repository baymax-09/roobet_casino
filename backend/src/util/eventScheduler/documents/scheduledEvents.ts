import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface ScheduledEvent {
  _id: Types.ObjectId
  topic: string
  triggerAt: Date
  params: Record<string, any>
  validUntil: Date | null
  status: 'scheduled' | 'complete' | 'canceled'
}

const ScheduledEventSchema = new mongoose.Schema<ScheduledEvent>(
  {
    topic: { type: String, required: true },
    triggerAt: { type: Date, required: true },
    params: { type: Object, required: true },
    validUntil: { type: Date },
    status: { type: String, default: 'scheduled' },
  },
  { timestamps: true },
)

ScheduledEventSchema.index({ triggerAt: 1, validUntil: 1, status: 1 })

const ScheduledEventModel = mongoose.model<ScheduledEvent>(
  'scheduled_events',
  ScheduledEventSchema,
)

/**
 * @param topic the channel this job will be produced in
 * @param triggerAt a JS Date object that represents when the event will trigger
 * @param params a POJO containing any relevant parameters to be attached to job
 * @param validUntil optional date when the job becomes invalid
 * @returns the eventId of the scheduled job, store this if you want to be able to cancel later
 */
export const createScheduledEvent = async <
  Params extends Record<string, any> = Record<string, any>,
>(
  topic: string,
  triggerAt: Date,
  params: Params,
  validUntil: Date | null = null,
): Promise<string> => {
  const { _id: eventId } = await ScheduledEventModel.create({
    topic,
    triggerAt,
    params,
    validUntil,
    status: 'scheduled',
  })
  return eventId.toString()
}

export const getAllScheduledEventsToTrigger = async (): Promise<
  ScheduledEvent[]
> => {
  const now = new Date()
  // Using $not for validUntil to account for documents with validUntil = null,
  // rather than an $or with $gte and not eq to null
  return await ScheduledEventModel.find({
    triggerAt: { $lte: now },
    validUntil: { $not: { $lt: now } },
    status: 'scheduled',
  }).lean()
}

export const completeScheduledEvent = async (eventId: string) => {
  await ScheduledEventModel.updateOne({ _id: eventId }, { status: 'complete' })
}

export const cancelScheduledEvent = async (eventId: string) => {
  await ScheduledEventModel.updateOne({ _id: eventId }, { status: 'canceled' })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: ScheduledEventModel.collection.name,
}
