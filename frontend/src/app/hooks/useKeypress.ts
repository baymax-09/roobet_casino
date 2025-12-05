import React from 'react'

export const useKeypress = (
  keys: Array<KeyboardEvent['key']>,
  callback: (event: KeyboardEvent) => void,
  element = window,
) => {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        callbackRef.current(event)
      }
    }
    element.addEventListener('keydown', handler)

    return () => element.removeEventListener('keydown', handler)
  }, [element])
}
