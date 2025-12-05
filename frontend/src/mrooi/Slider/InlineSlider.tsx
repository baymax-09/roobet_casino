import React from 'react'
import { ActionIcon, GradientMask, theme as uiTheme } from '@project-atl/ui'
import { ChevronLeft, ChevronRight } from '@project-atl/ui/assets'
import clsx from 'clsx'

import { useTranslate } from 'app/hooks'

import { DEFAULT_OPTIONS, useSliderController, type SliderOptions } from './lib'

import { useSliderStyles } from './Slider.styles'

interface SliderProps {
  slides: React.ComponentType[]
  title?: string | React.ReactNode
  options?: Partial<SliderOptions>
  showNav?: boolean
  indexOverride?: number
  fullPageSlide?: boolean
  noSlidesText?: React.ReactNode
  showGradients?: boolean
  slideClassName?: string
}

export const InlineSlider: React.FC<SliderProps> = ({
  options: _options = {},
  slides = [],
  showNav = true,
  indexOverride,
  fullPageSlide = false,
  noSlidesText,
  showGradients = true,
  slideClassName,
}) => {
  const options = React.useMemo<SliderOptions>(
    () => ({ ...DEFAULT_OPTIONS, ..._options }),
    [_options],
  )

  const translate = useTranslate()

  // Slide tracking and navigation abstraction.
  const {
    activeIndex,
    setContainerRef,
    goPrevPage,
    goNextPage,
    sliderRef,
    slidesPerView,
    containerRef,
  } = useSliderController({
    options,
    indexOverride,
    fullPageSlide,
  })

  // Pass calculated options into styles.
  const classes = useSliderStyles({
    slidesPerView,
    spaceBetween: 8,
    fullPageSlide,
  })

  return (
    <div className={classes.root} ref={sliderRef}>
      {slides.length > slidesPerView && showNav && (
        <>
          {activeIndex !== 0 && (
            <div
              onClick={goPrevPage}
              title={translate('slider.prevPage')}
              className={classes.InlineSlider__leftNavButton}
            >
              <ActionIcon hoverBackgroundColor={uiTheme.palette.neutral[800]}>
                <ChevronLeft />
              </ActionIcon>
            </div>
          )}
          {activeIndex + Math.floor(slidesPerView) !== slides.length && (
            <div
              className={classes.InlineSlider__rightNavButton}
              onClick={goNextPage}
              title={translate('slider.nextPage')}
            >
              <ActionIcon hoverBackgroundColor={uiTheme.palette.neutral[800]}>
                <ChevronRight />
              </ActionIcon>
            </div>
          )}
        </>
      )}
      {!!slides.length && (
        <div ref={setContainerRef} className={classes.InlineSlider__slides}>
          {slides.map((Slide, i) => (
            <div key={i} className={clsx(classes.slide, slideClassName)}>
              <Slide />
            </div>
          ))}
        </div>
      )}
      {!slides.length && !!noSlidesText && noSlidesText}
      {showGradients && (
        <GradientMask
          containerRef={containerRef}
          loading={false}
          width={75}
          removeLeftGradient={true}
        />
      )}
    </div>
  )
}
