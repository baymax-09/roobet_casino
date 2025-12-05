export interface PublicProfileRequest {
  nameId?: string
}

export type PublicProfileStats = Partial<{
  totalBet: number
  totalBets: number
  totalMuteCount: number
  totalBanCount: number
  totalTipped: number
  roowardsClaimed: number
  hidden: boolean
  roowardsLevels: {
    d: number
    w: number
    m: number
  }
}>

export interface PublicProfileResponse extends PublicProfileStats {
  id: string
  name: string
  createdAt: string
}
