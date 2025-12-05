export interface Message {
  __typename: 'MessageDetailed'
  id: string
  title: string
  body: string
  heroImage: string | null
  featuredImage: string | null
  link: string
  logoImage: string | null
  recipientCount: number
  readCount: number
  live: boolean
  liveAt: string
  deleted: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  recipients: string[]
}
