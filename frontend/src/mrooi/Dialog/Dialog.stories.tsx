import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Dialog, LoginOverlay } from 'mrooi'

import { PrivateDialog } from './Private'

type DialogType = typeof Dialog

export default {
  title: 'Components/Dialog/Dialog',
  component: Dialog,
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', false],
      defaultValue: 'xs',
    },
    open: { control: 'boolean', defaultValue: true },
    fullScreen: { control: 'boolean', defaultValue: false },
    fullWidth: { control: 'boolean', defaultValue: true },
    isLoggedIn: { control: 'boolean', defaultValue: true },
  },
} as Meta<DialogType>

const Template: StoryFn<DialogType> = args => (
  <PrivateDialog DialogProps={null} {...args} />
)
const Overlay: StoryFn<typeof LoginOverlay> = params => (
  <LoginOverlay {...params} />
)

export const dialog = Template.bind({})
dialog.args = {}

export const loginOverlay = Overlay.bind({})
loginOverlay.args = {}
