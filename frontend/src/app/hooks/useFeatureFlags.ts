import React from 'react'
import { useSelector, shallowEqual } from 'react-redux'

export function useFeatureFlags(requiredFeatureNames: string[]): {
  allowed: boolean
  loading: boolean
} {
  const enabledFeatures = useSelector(
    ({ settings }) => settings?.flags ?? {},
    shallowEqual,
  )
  const userLoaded = useSelector(({ settings }) => settings.loaded)

  const allowed =
    userLoaded &&
    requiredFeatureNames.every(featureName => !!enabledFeatures[featureName])
  const loading = !userLoaded
  return { allowed, loading }
}

export const useAllFeatureFlags = (): string[] => {
  const featureMap = useSelector(
    ({ settings }) => settings?.flags ?? {},
    shallowEqual,
  )

  // Memoize flat list of feature names.
  const enabledFeatures = React.useMemo(() => {
    return Object.keys(featureMap).filter(
      featureName => !!featureMap[featureName],
    )
  }, [featureMap])

  return enabledFeatures
}
