import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { DateTextMask } from './DateTextMask'

type DateTextMaskType = typeof DateTextMask

export default {
  title: 'Components/DateTextMask',
  component: DateTextMask,
} as Meta<DateTextMaskType>

const Template: StoryFn<DateTextMaskType> = args => <DateTextMask {...args} />

export const Primary = Template.bind({})
Primary.args = {
  placeholder: 'DD/MM/YYYY',
  disabled: false,
  inputRef: () => {},
}

export const Disabled = Template.bind({})
Disabled.args = {
  placeholder: 'DD/MM/YYYY',
  disabled: true,
  inputRef: () => {},
}
