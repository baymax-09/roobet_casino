import { type AVAILABLE_FEATURES } from './constants'

export type FeatureState = 'alpha' | 'beta' | 'final'
export type FeatureName = (typeof AVAILABLE_FEATURES)[number]

export interface FeatureFlag {
  state: FeatureState
  name: FeatureName
  disabled: boolean

  /** list of country codes */
  regionList: string[]
  /** list of user IDs */
  betaTesters: string[]
}
