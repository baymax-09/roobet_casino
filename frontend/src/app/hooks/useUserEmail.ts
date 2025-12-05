import { useSelector } from 'react-redux'

export function useUserEmail() {
  const email = useSelector(({ user }) => user?.email ?? '')
  const emailVerified = useSelector(({ user }) => user?.emailVerified ?? false)

  return [email, emailVerified]
}
