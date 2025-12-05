export interface Message {
  id: string
  recipients: Array<string | number> | null // Only "number" when received from FastTrack
  // Fields from message templates.
  title: string
  body: string
  recipientCount?: number | null
  heroImage: string | null
  logoImage: string | null
  featuredImage: string | null
  link: string | null
  live: boolean
  liveAt: string | null
  meta?: {
    scheduledEmitEventId?: string
    // Received from FastTrack
    richInboxMessageId?: number
  }
  read: boolean
  createdAt?: string
  updatedAt?: string
  __typename: 'Message'
}
