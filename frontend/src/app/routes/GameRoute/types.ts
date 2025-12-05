import { type NormalizedTPGame } from 'common/types'

export interface GameRouteViewProps {
  gameIdentifier: string
  game: NormalizedTPGame | null
  errorMessage: string | null
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  toggleFavorited: (() => Promise<void>) | null
  favorited: boolean | null
  realMode: boolean
  toggleRealMode: (nextValue?: any) => void
  loading: boolean
  isBlocked: boolean
  enabledFeatures: string[]
}
