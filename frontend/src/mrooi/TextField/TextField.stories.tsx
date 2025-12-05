import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { TextField } from './TextField'

type TextFieldType = typeof TextField

export default {
  title: 'Components/TextField',
  component: TextField,
} as Meta<TextFieldType>

const Template: StoryFn<TextFieldType> = args => <TextField {...args} />

export const Default = Template.bind({})
Default.args = {}

export const Light = Template.bind({})
Light.args = {
  light: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  disabled: true,
}
