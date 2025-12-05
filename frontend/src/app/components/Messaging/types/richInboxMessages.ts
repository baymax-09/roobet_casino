export interface ExistingMessage {
  MessageId: number
  UserId: string
  Event: 'shoutout' | 'message' | 'inbox'
  Title: string
  Message: string // Can contain HTML
  PreviewText: string // Cannot contain HTML
  FooterText: string // Can contain HTML
  Data: object // Extra fields for your usage
  DisplayType: 'push' | 'silent'
  CTAButtonLink: string
  CTAButtonText: string
  CTAButton2Link: string
  CTAButton2Text: string
  ImageUrl: string
  IsRead: boolean
  Date: string
  Expires: string
  ActivityId: number
  ActionGroupId: number
  ActionId: number
  TriggerHash: string
}

export interface ExistingMessagesResponse {
  Data: ExistingMessage[]
  Success: true
  Errors: []
}
