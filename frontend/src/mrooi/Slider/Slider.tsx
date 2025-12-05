import React from 'react'
import clsx from 'clsx'
import { useMediaQuery } from '@mui/material'
import {
  GradientMask,
  IconButton,
  Typography,
  Button,
  theme as uiTheme,
} from '@project-atl/ui'
import { ChevronLeft, ChevronRight } from '@project-atl/ui/assets'
import { Link as RouterLink } from 'react-router-dom'

import { useTranslate } from 'app/hooks'

import { DEFAULT_OPTIONS, useSliderController, type SliderOptions } from './lib'

import { useSliderStyles } from './Slider.styles'

type Slide = JSX.Element

interface ViewAllLinkProps {
  path: string
}

export interface SliderProps {
  slides: Slide[]
  title?: string
  options?: Partial<SliderOptions>
  showNav?: boolean
  showViewAll?: boolean
  indexOverride?: number
  fullPageSlide?: boolean
  noSlidesText?: React.ReactNode
  slidesClassName?: string
  slideClassName?: string
  includeGradientMask?: boolean
  className?: string
  sliderContainerClassName?: string
  viewAllButtonProps?: ViewAllLinkProps
}

export const Slider: React.FC<SliderProps> = ({
  title,
  options: _options = {},
  slides = [],
  showNav = false,
  showViewAll = true,
  indexOverride,
  fullPageSlide = false,
  noSlidesText,
  slidesClassName,
  slideClassName,
  includeGradientMask = true,
  className,
  sliderContainerClassName,
  viewAllButtonProps,
}) => {
  const options = React.useMemo<SliderOptions>(
    () => ({ ...DEFAULT_OPTIONS, ..._options }),
    [_options],
  )

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const translate = useTranslate()

  // Navigation element refs.
  const prevPageRef = React.useRef<HTMLButtonElement | null>(null)
  const nextPageRef = React.useRef<HTMLButtonElement | null>(null)

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
    fullPageSlide,
  })

  /**  When the Slider is scrolled all the way to the right, and has the "scrollSnapType: 'x mandatory'" style applied,
   * the slides don't get cut off like we want them too and stay snapped from the right. To avoid this, we're making the
   * "scrollSnapType: 'none'" when all the way to the right, and then back to it's original 'x mandatory' style when not. */
  const isScrolledToRight = React.useCallback((table: HTMLDivElement) => {
    if (table) {
      return table.scrollLeft >= table.scrollWidth - table.clientWidth - 16
    }
    return false
  }, [])

  const handleTableResizeEvent = React.useCallback(() => {
    const table = containerRef.current

    if (table) {
      if (isScrolledToRight(table)) {
        table.style.scrollSnapType = 'none'
      } else {
        table.style.scrollSnapType = 'x mandatory'
      }
    }
  }, [containerRef.current, isScrolledToRight])

  React.useEffect(() => {
    const table = containerRef.current

    const resizeObserver = new ResizeObserver(_ => {
      handleTableResizeEvent()
    })

    if (table) {
      resizeObserver.observe(table)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef.current])

  const showNavCondition = isTabletOrDesktop || showNav
  const showHeader = title || viewAllButtonProps

  return (
    <div className={clsx(classes.root, className)} ref={sliderRef}>
      {showHeader && (
        <div className={classes.header}>
          {title &&
            (!viewAllButtonProps ? (
              <Typography
                variant="h5"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
                {...(!isTabletOrDesktop && {
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                })}
              >
                {translate(title)}
              </Typography>
            ) : (
              <RouterLink
                className={classes.TitleLinkContainer}
                to={viewAllButtonProps.path}
              >
                <div className={classes.TitleLinkContainer__wrapper}>
                  <div className={classes.TitleLinkContainer__content}>
                    <Typography
                      variant="h5"
                      color={uiTheme.palette.common.white}
                      fontWeight={uiTheme.typography.fontWeightBold}
                      {...(!isTabletOrDesktop && {
                        fontSize: '1.5rem',
                        lineHeight: '2rem',
                      })}
                    >
                      {translate(title)}
                    </Typography>
                    {showViewAll && (
                      <div className={classes.ViewAllButton}>
                        <Button
                          variant="contained"
                          color="tertiary"
                          size={isTabletOrDesktop ? 'large' : 'small'}
                          label={translate('gameList.viewAll')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </RouterLink>
            ))}
          {slides.length > slidesPerView && showNavCondition && (
            <div className={classes.navigation}>
              <IconButton
                onClick={goPrevPage}
                ref={prevPageRef}
                title={translate('slider.prevPage')}
                disabled={activeIndex === 0}
                className={clsx(
                  classes.navigationButton,
                  classes.navigationButton_left,
                )}
                size={isTabletOrDesktop ? 'large' : 'small'}
                color="tertiary"
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={goNextPage}
                ref={nextPageRef}
                title={translate('slider.nextPage')}
                disabled={
                  activeIndex + Math.floor(slidesPerView) === slides.length
                }
                className={clsx(
                  classes.navigationButton,
                  classes.navigationButton_right,
                )}
                size={isTabletOrDesktop ? 'large' : 'small'}
                color="tertiary"
              >
                <ChevronRight />
              </IconButton>
            </div>
          )}
        </div>
      )}
      {!!slides.length && (
        <div
          className={clsx(classes.SliderContainer, sliderContainerClassName)}
        >
          {includeGradientMask && (
            <GradientMask
              containerRef={containerRef}
              loading={false}
              removeLeftGradient={true}
              width={64}
            />
          )}

          <div
            ref={setContainerRef}
            className={clsx(classes.slides, slidesClassName)}
          >
            {slides.map((Slide, i) => (
              <div key={i} className={clsx(classes.slide, slideClassName)}>
                {Slide}
              </div>
            ))}
          </div>
        </div>
      )}
      {!slides.length && !!noSlidesText && noSlidesText}
    </div>
  )
}
