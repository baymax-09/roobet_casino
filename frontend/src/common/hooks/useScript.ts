import React from 'react'

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

export function useScript({
  src,
  onLoad,
  attributes,
}: {
  src: string
  onLoad?: () => void
  attributes?: Record<string, string>
}) {
  const [attached, setAttached] = React.useState(false)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    if (!isBrowser || !src) {
      return
    }

    const scriptEl = document.createElement('script')

    scriptEl.src = src
    scriptEl.async = true
    scriptEl.onload = () => {
      setAttached(true)
      setError(false)

      if (onLoad) {
        onLoad()
      }
    }
    scriptEl.onerror = () => {
      setAttached(false)
      setError(true)
    }

    // Add additional attributes.
    for (const [key, value] of Object.entries(attributes ?? {})) {
      scriptEl.setAttribute(key, value)
    }

    // Append script to document
    document.body.appendChild(scriptEl)

    return () => {
      // Remove child node when hook/component is unmounted.
      document.body.removeChild(scriptEl)
    }
  }, [src, attributes, onLoad])

  return { attached, error }
}
