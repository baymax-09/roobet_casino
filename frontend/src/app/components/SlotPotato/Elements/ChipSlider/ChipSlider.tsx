import React, { useMemo } from 'react'

import { type SlotPotatoGame } from 'app/gql/slotPotato'
import { Slider } from 'mrooi'

import { SliderItem } from './SliderItem'

import { useChipSliderStyles } from './ChipSlider.styles'

export interface ChipSliderProps {
  games: SlotPotatoGame[]
  activeGameId: string
  gameDuration: number
}

export const ChipSlider: React.FC<ChipSliderProps> = ({
  games,
  activeGameId,
  gameDuration,
}) => {
  const classes = useChipSliderStyles()
  const activeGameIdx = games.findIndex(({ game }) => {
    return game.id === activeGameId
  })

  const sliderOptions = {
    spaceBetween: 4,
    slidesPerView: 2,
    breakpoints: {
      555: {
        slidesPerView: 3,
        spaceBetween: 8,
      },
    },
  }

  const slides = useMemo(() => {
    const gameChips = games
      .map(({ game, startDateTime }, idx) => {
        if (activeGameIdx === idx) {
          return null
        }

        return (
          <SliderItem
            key={`carousel-item-${idx}`}
            game={game}
            startDateTime={startDateTime}
            idx={idx}
            gameDuration={gameDuration}
            activeGameId={activeGameId}
            activeGameIdx={activeGameIdx}
          />
        )
      })
      .filter((chip: JSX.Element | null): chip is JSX.Element => chip !== null)
    return gameChips
  }, [activeGameId, activeGameIdx, gameDuration, games])

  return (
    <div className={classes.OuterSliderContainer}>
      <div className={classes.SliderContainer}>
        <Slider
          slides={slides}
          showNav={false}
          options={sliderOptions}
          indexOverride={activeGameIdx}
          slidesClassName={classes.Slides}
          slideClassName={classes.Slide}
          includeGradientMask={false}
        />
      </div>
    </div>
  )
}
