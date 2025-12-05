import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Slider } from 'mrooi'

import { TemplateSlider } from './Private'

type SliderType = typeof Slider

export default {
  title: 'Components/Slider',
  component: Slider,
  argTypes: {},
} as Meta<SliderType>

const Template: StoryFn<SliderType> = args => <TemplateSlider {...args} />

export const template = Template.bind({})
template.args = {
  title: 'Template Slider From Private',
}

template.parameters = {
  backgrounds: { default: 'dark' },
}
