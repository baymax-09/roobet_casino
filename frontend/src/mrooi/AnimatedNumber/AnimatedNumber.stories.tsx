import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import AnimatedNumber from './AnimatedNumber'

type AnimatedNumberType = typeof AnimatedNumber

export default {
  title: 'Components/AnimatedNumber',
  component: AnimatedNumber,
} as Meta<AnimatedNumberType>

const Template: StoryFn<AnimatedNumberType> = args => (
  <AnimatedNumber {...args} />
)

export const BaseAnimatedNumber = Template.bind({})

BaseAnimatedNumber.args = {
  format: '$0,0.00',
  value: 1000,
  lastValue: 0,
}

BaseAnimatedNumber.parameters = {
  backgrounds: { default: 'dark' },
}
