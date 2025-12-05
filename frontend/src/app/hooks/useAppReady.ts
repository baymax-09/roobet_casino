import { useSelector } from 'react-redux'

export function useAppReady() {
  const isReady = useSelector(({ settings }) => {
    return settings.loadedUser || false
  })

  return isReady
}
