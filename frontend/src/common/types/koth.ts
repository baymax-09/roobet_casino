const KOTHFlavors = ['astro', 'king'] as const
export type KOTHFlavor = (typeof KOTHFlavors)[number]
export const isKOTHFlavor = (value: any): value is KOTHFlavor =>
  KOTHFlavors.includes(value)
export interface KOTH {
  _id: string
  startTime: string
  endTime: string
  currentUserId: string
  earnings: number
  currency: string
  multiplier: number
  whichRoo: KOTHFlavor
  minBet: number
  isActive: boolean
}

export type CreateKOTHRequest = Pick<
  KOTH,
  'startTime' | 'endTime' | 'whichRoo' | 'minBet'
>

export interface UpdateKOTHRequest extends CreateKOTHRequest {
  _id: string
}
export type KOTHState = 'starting' | 'active' | 'ended'
