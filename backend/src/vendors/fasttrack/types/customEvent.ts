import { type Request } from 'express'

export interface CustomEventPayload {
  notificationType: string
  userId: string
  request: Request
  data: Record<string, string | boolean | number>
}
