import { useTranslation } from 'react-i18next'

export const useLocale = (moduleKey = undefined) => {
  const { language } = useTranslation(moduleKey).i18n
  return language
}
