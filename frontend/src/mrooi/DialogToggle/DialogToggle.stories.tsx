import React from 'react'
import {
  ThemeProvider,
  StyledEngineProvider,
  CssBaseline,
  Button,
} from '@mui/material'
import LaunchIcon from '@mui/icons-material/Launch'
import CloseIcon from '@mui/icons-material/Close'
import { type StoryFn, type Meta } from '@storybook/react'

import { theme } from 'common/theme'

import DialogToggle from './DialogToggle'

type DialogToggleType = typeof DialogToggle

export default {
  title: 'Components/Dialog/DialogToggle',
  component: DialogToggle,
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'initial'],
      defaultValue: 'primary',
    },
    variant: {
      control: 'select',
      options: ['outlined', 'contained', 'text'],
      defaultValue: 'contained',
    },
    component: { defaultValue: Button },
    size: { control: 'radio', options: ['small', 'medium', 'large'] },
    disableRipple: {
      control: 'boolean',
      options: [true, false],
      defaultValue: false,
    },
    disabled: {
      control: 'boolean',
      options: [true, false],
      defaultValue: false,
    },
    fullWidth: {
      control: 'boolean',
      options: [true, false],
      defaultValue: false,
    },
    startIcon: {
      control: 'boolean',
      options: [true, false],
      defaultValue: true,
    },
  },
  decorators: [
    Story => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Story />
        </ThemeProvider>
      </StyledEngineProvider>
    ),
  ],
} as Meta<DialogToggleType>

const Template: StoryFn<DialogToggleType> = args => <DialogToggle {...args} />

export const Close = Template.bind({})
Close.args = {
  children: 'Dialog Toggle',
  startIcon: <CloseIcon />,
}

export const Launch = Template.bind({})
Launch.args = {
  children: 'Dialog Toggle',
  startIcon: <LaunchIcon />,
}
