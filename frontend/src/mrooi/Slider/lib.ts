import React from 'react'
import { useMeasure, useWindowSize } from 'react-use'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

interface SliderControllerProps {
  options: SliderOptions
  indexOverride?: number
  fullPageSlide?: boolean
}

// TODO: Import this instead of redefining it.
// e.g., `SliderStylesParams` in `HomepageGameThumbnailSkeleton.styles.ts
// or `SliderStylesParams` in `Slider.styles.ts`
export interface SliderBreakpoint {
  slidesPerView: number
  spaceBetween: number
}

export interface SliderOptions extends SliderBreakpoint {
  breakpoints: Record<number, SliderBreakpoint>
}

export const DEFAULT_OPTIONS: SliderOptions = {
  spaceBetween: 8,
  slidesPerView: 3,
  breakpoints: {
    [uiTheme.breakpoints.values.sm]: {
      slidesPerView: 4,
      spaceBetween: 8,
    },
    [uiTheme.breakpoints.values.md]: {
      slidesPerView: 5.5,
      spaceBetween: 16,
    },
    [uiTheme.breakpoints.values.lg]: {
      slidesPerView: 6.5,
      spaceBetween: 16,
    },
  },
}

export const useDefaultSliderBreakpoints = (): SliderBreakpoint => {
  const isLargeScreen = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isMobile = useMediaQuery(() => uiTheme.breakpoints.up('sm'), {
    noSsr: true,
  })
  if (isLargeScreen) {
    return DEFAULT_OPTIONS.breakpoints[uiTheme.breakpoints.values.lg]
  } else if (isTabletOrDesktop) {
    return DEFAULT_OPTIONS.breakpoints[uiTheme.breakpoints.values.md]
  } else if (isMobile) {
    return DEFAULT_OPTIONS.breakpoints[uiTheme.breakpoints.values.sm]
  }
  return DEFAULT_OPTIONS
}

export const useSliderController = ({
  options,
  indexOverride,
  fullPageSlide = false,
}: SliderControllerProps) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const previousX = React.useRef(0)

  const [slideElements, setSlideElements] = React.useState<HTMLElement[]>([])
  const [activeIndex, setActiveIndex] = React.useState<number>(
    indexOverride ?? 0,
  )

  const [slidesPerView, setSlidesPerView] = React.useState(3)
  const showLowOpacitySlides = false

  // Changing the window width does not trigger the intersection observer,
  // we need to create a new instance on resize to update the active index.
  const windowSize = useWindowSize()

  const [sliderRef, sliderSize] = useMeasure()
  const sliderWrapperSize = React.useMemo(() => {
    const height = sliderSize.height
    const width = sliderSize.width

    return {
      width,
      height,
    }
  }, [sliderSize.width, sliderSize.height])

  const handleIntersect = React.useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (!containerRef.current) {
        return
      }

      const currentX = containerRef.current.scrollLeft ?? 0

      const entry = entries.find(({ isIntersecting }) => isIntersecting)

      if (entry) {
        const index = slideElements.findIndex(node => node === entry.target)

        // Do not update index if offset hasn't changed.
        if (currentX === previousX.current) {
          return
        }

        const newIndex = Math.max(
          currentX < previousX.current
            ? index
            : index - Math.floor(slidesPerView) + 1,
          0,
        )

        setActiveIndex(newIndex)
        // We are writing this to ref since this value
        // does not need to cause rerenders.
        previousX.current = currentX
      }
    },
    [slideElements, slidesPerView, showLowOpacitySlides],
  )

  const setContainerRef = React.useCallback((listContainer: HTMLDivElement) => {
    if (!listContainer?.children) {
      return
    }

    const elements = Array.from(listContainer.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    )

    setSlideElements(elements)

    containerRef.current = listContainer

    if (elements[activeIndex]) {
      containerRef.current.scroll({
        top: 0,
        left: elements[activeIndex].offsetLeft,
      })
    }
  }, [])

  const goPrevPage = React.useCallback(() => {
    let nextIndex =
      activeIndex - (fullPageSlide ? Math.floor(slidesPerView) : 1)
    if (nextIndex < 0) {
      nextIndex = 0
    }
    if (containerRef.current && slideElements[nextIndex]) {
      containerRef.current.scroll({
        top: 0,
        left: slideElements[nextIndex].offsetLeft,
        behavior: 'smooth',
      })
    }
  }, [activeIndex, slideElements, containerRef, slidesPerView, fullPageSlide])

  const goNextPage = React.useCallback(() => {
    let nextIndex =
      activeIndex + (fullPageSlide ? Math.floor(slidesPerView) : 1)
    const finalIndex = slideElements.length - 1
    if (nextIndex > finalIndex) {
      nextIndex = finalIndex
    }
    if (containerRef.current && slideElements[nextIndex]) {
      containerRef.current.scroll({
        top: 0,
        left: slideElements[nextIndex].offsetLeft,
        behavior: 'smooth',
      })
    }
  }, [activeIndex, slideElements, containerRef, slidesPerView, fullPageSlide])

  React.useEffect(() => {
    if (!containerRef.current || slideElements.length === 0) {
      return
    }

    const observer = new IntersectionObserver(handleIntersect, {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.9,
    })

    for (const node of slideElements) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
    }
  }, [handleIntersect, slideElements, windowSize.width, showLowOpacitySlides])

  // Calculate properties based on passed on number of children shown in container.
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries && entries.length > 0) {
        const containerWidth = entries[0].contentRect.width
        const children = containerRef.current
          ?.children as HTMLCollectionOf<HTMLElement>
        let count = 0

        Array.from(children).forEach(child => {
          const childLeft = child.offsetLeft
          const childRight = childLeft + child.offsetWidth

          if (childLeft >= 0 && childRight <= containerWidth) {
            count++
          }
        })

        setSlidesPerView(count)
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])
  return {
    activeIndex,
    goPrevPage,
    goNextPage,
    setContainerRef,
    containerRef,
    sliderRef,
    sliderWrapperSize,
    slidesPerView,
  }
}
