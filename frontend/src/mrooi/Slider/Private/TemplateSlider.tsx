import React from 'react'

import { Slider } from 'mrooi'
import { GAME_PROVIDERS } from 'app/constants'

import { useTemplateSliderStyles } from './TemplateSlider.styles'

export const TemplateSlider = args => {
  const styles = useTemplateSliderStyles()

  const Item = ({ title }) => {
    return (
      <div className={styles.item}>
        <div className={styles.block}>{title}</div>
      </div>
    )
  }
  const slides = React.useMemo(
    () =>
      Object.entries(GAME_PROVIDERS).map(([key, provider]) => (
        <Item key={key} {...provider} />
      )),
    [],
  )

  return (
    <div>
      <Slider slides={slides} {...args} />
    </div>
  )
}
