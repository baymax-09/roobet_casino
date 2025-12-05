import { useEffect, useState } from 'react'

/**
 * Format date time without moment. Since this is used by the ACP & the product,
 * we cannot easily determine the user's locale.
 */
const formatDate = (input: Date): string => {
  const locale = navigator.language ?? 'en-US'

  const parsed = new Date(input.toISOString())
  const date = parsed.toLocaleDateString(locale, {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
  const time = parsed.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  return `${date} ${time} UTC`
}

const useRaffleState = (start: Date | string, end: Date | string) => {
  const [raffleState, setRaffleState] = useState<string | null>(null)
  const [stateText, setStateText] = useState('Loading...')

  useEffect(() => {
    if (!start || !end) {
      setRaffleState(null)
      return
    }

    let timeout: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      const now = new Date()
      const startTime = new Date(start)
      const endTime = new Date(end)

      if (startTime > now) {
        setRaffleState('starting')
        setStateText(formatDate(startTime))
      }

      if (now > endTime) {
        setRaffleState('over')
        return
      }

      if (now > startTime && endTime > now) {
        setRaffleState('active')
        setStateText(formatDate(endTime))
      }

      timeout = setTimeout(tick, 1000)
    }

    tick()

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [start, end])

  return {
    raffleState,
    stateText,
  }
}

export default useRaffleState
