import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { DateTimePicker } from './DateTimePicker'

type DateTimePickerType = typeof DateTimePicker

export default {
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
  argTypes: {
    label: { control: 'text' },
    disablePast: { control: 'boolean' },
    disableFuture: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} as Meta<DateTimePickerType>

const Template: StoryFn<DateTimePickerType> = args => (
  <DateTimePicker {...args} />
)

export const DefaultACP = Template.bind({})

DefaultACP.parameters = {
  theme: 'ACPLightMode',
}
