import React from 'react'
import anime from 'animejs'

import { useScreenFlashStyles } from './ScreenFlash.styles'

interface ScreenFlashProps {
  actionsRef: React.MutableRefObject<{ flash: () => void } | null>
}

export const ScreenFlash = React.memo(({ actionsRef }: ScreenFlashProps) => {
  const classes = useScreenFlashStyles()
  const flashRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const tm = anime({
      autoplay: false,
      targets: flashRef.current,
      opacity: [1, 0],
      scale: [1, 1.4],
      easing: 'linear',
      duration: 600,

      begin() {
        if (flashRef.current) {
          flashRef.current.style.display = 'block'
        }
      },

      complete() {
        if (flashRef.current) {
          flashRef.current.style.display = 'none'
        }
      },
    })

    actionsRef.current = {
      flash() {
        tm.restart()
      },
    }
  }, [])

  return <div ref={flashRef} className={classes.root} />
})
