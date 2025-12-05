import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { ActionButton } from './ActionButton'

type ActionButtonType = typeof ActionButton
export default {
  title: 'Components/ActionButton',
  component: ActionButton,
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary'] },
    variant: { control: 'select', options: ['outlined', 'contained', 'text'] },
  },
} as Meta<ActionButtonType>

const Template: StoryFn<ActionButtonType> = args => <ActionButton {...args} />

export const Primary = Template.bind({})
Primary.args = {
  children: 'Action',
  variant: 'contained',
  color: 'primary',
}
export const Secondary = Template.bind({})

Secondary.args = {
  children: 'Action',
  variant: 'contained',
  color: 'secondary',
}
