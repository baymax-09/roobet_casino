const ReconciliationFieldValues = [
  'blocked',
  'excluded',
  'consent_email',
  'consent_sms',
  'consent_telephone',
  'consent_post_mail',
  'consent_site_notification',
  'consent_push_notification',
] as const
export type ReconciliationField = (typeof ReconciliationFieldValues)[number]

export const ReconcilationToConsentDBMap: Record<
  Exclude<ReconciliationField, 'blocked' | 'excluded'>,
  string
> = {
  consent_email: 'email',
  consent_sms: 'sms',
  consent_telephone: 'telephone',
  consent_post_mail: 'postMail',
  consent_site_notification: 'siteNotification',
  consent_push_notification: 'pushNotification',
}

export const isReconcilationField = (
  field: any,
): field is ReconciliationField => ReconciliationFieldValues.includes(field)

export interface ReconciliationRequest {
  field: ReconciliationField
}

export interface ReconciliationResponse {
  users: string[]
  timestamp: string // "2020-01-01T10:00:00Z"
}
