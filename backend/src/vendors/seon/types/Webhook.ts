import { type SeonRequest } from 'src/vendors/seon/types'

type SeonList = 'blacklist-whitelist' | 'customlist'
export type WebhookEvent = 'transaction:status_update' | `lists:${SeonList}`

export type State = 'whitelist' | 'blacklist' | 'normal' | 'list'
export type CustomState =
  | 'deposit_aml_threshold_level_2'
  | 'withdrawal_aml_threshold_level_2'

export interface PayloadValue<T> {
  data_field: keyof SeonRequest
  value: string
  state: T
}

export type PayloadValues<T extends WebhookEvent> = {
  'lists:blacklist-whitelist': Array<PayloadValue<State>>
  'lists:customlist': Array<PayloadValue<CustomState>>
  'transaction:status_update': null
}[T]

export interface WebhookPayload<T extends WebhookEvent> {
  event: T
  date: string
  values: PayloadValues<T>
}
