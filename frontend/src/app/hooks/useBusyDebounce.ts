import React from 'react'

// TS: Why doesn't this ship by default?
type Timeout = ReturnType<typeof setTimeout>

export const useBusyDebounce = (
  defaultValue = false,
): [boolean, (soonBusy: boolean) => void] => {
  const timeout = React.useRef<Timeout | undefined>()
  const [busy, setBusy] = React.useState(defaultValue)

  const setBusyDebounce = React.useCallback((soonBusy: boolean) => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }

    if (soonBusy) {
      setBusy(true)
      return
    }

    timeout.current = setTimeout(() => {
      setBusy(false)
    }, 500)
  }, [])

  return [busy, setBusyDebounce]
}
