import { useTranslation } from 'react-i18next'

// TODO: Dynamically load if package hasn't been loaded yet
export function useTranslate(moduleKey = undefined) {
  const { t: translate } = useTranslation(moduleKey)
  return translate
}
