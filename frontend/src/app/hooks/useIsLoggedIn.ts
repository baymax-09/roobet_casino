import { useSelector } from 'react-redux'

export function useIsLoggedIn() {
  const isLoggedIn = useSelector(({ user }) => {
    return !!user || false
  })

  return isLoggedIn
}
