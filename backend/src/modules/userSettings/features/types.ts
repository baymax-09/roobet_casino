const UserGrantedFeatureSettingValues = ['paymentiq', 'tipPlayers'] as const

export interface UserGrantedFeaturesRequest {
  countryCode: string
}
export interface UserSingleGrantedFeatureRequest {
  countryCode: string
  feature: UserGrantedFeatureSettings
}
export type UserGrantedFeatureSettings =
  (typeof UserGrantedFeatureSettingValues)[number]
