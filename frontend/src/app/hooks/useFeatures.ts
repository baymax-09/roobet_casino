import { useSelector, shallowEqual } from 'react-redux'

export function useFeatures(requiredFeatureNames: string[]): {
  allowed: boolean
  loading: boolean
} {
  const enabledFeatures = useSelector(
    ({ settings }) => settings?.features ?? {},
    shallowEqual,
  )
  const userLoaded = useSelector(({ settings }) => settings.loaded)

  const allowed =
    userLoaded &&
    requiredFeatureNames.every(featureName => !!enabledFeatures[featureName])
  const loading = !userLoaded
  return { allowed, loading }
}
