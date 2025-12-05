import { useSelector } from 'react-redux'

import { useLocale } from 'app/hooks'

export const useUniboCookies = (gameIdentifier?: string) => {
  const userId = useSelector(({ user }) => user?.id)
  const createdAt = useSelector(({ user }) => user?.createdAt)
  const locale = useLocale()

  if (!gameIdentifier) {
    return
  }

  /** There are some issues with the cookies not being processed by Unibo
   *  properly, due to game provider script(s), when the cookies are not at root level */
  document.cookie = `language=${locale}; path=/`
  document.cookie = `unibo_gameId=${gameIdentifier}; path=/`
  document.cookie = `unibo_userId=${userId}; path=/`
  document.cookie = `unibo_registrationDate=${Math.floor(
    Date.parse(createdAt) / 1000,
  )}; path=/`
}
