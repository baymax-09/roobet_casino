import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import DialogTitle from './DialogTitle'

type DialogTitleType = typeof DialogTitle

export default {
  title: 'Components/Dialog/DialogTitle',
  component: DialogTitle,
  argTypes: {
    children: { control: 'text', defaultValue: 'Dialog Title' },
    compact: { control: 'radio', options: [true, false], defaultValue: false },
  },
} as Meta<DialogTitleType>

const Template: StoryFn<DialogTitleType> = args => <DialogTitle {...args} />

export const Dark = Template.bind({})
Dark.args = {
  dark: true,
  light: false,
}

export const Light = Template.bind({})
Light.args = {
  dark: false,
  light: false,
}
