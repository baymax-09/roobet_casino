import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'
import { type StoryFn, type Meta } from '@storybook/react'

import { lightTheme } from 'admin/theme'

import { TitleContainer } from './TitleContainer'
import { ActionButton } from '../ActionButton'

type TitleContainerType = typeof TitleContainer

export default {
  title: 'Components/TitleContainer',
  component: TitleContainer,
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary'] },
    variant: { control: 'select', options: ['outlined', 'contained', 'text'] },
  },
  decorators: [
    Story => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightTheme}>
          <Story />
        </ThemeProvider>
      </StyledEngineProvider>
    ),
  ],
} as Meta<TitleContainerType>

const Template: StoryFn<TitleContainerType> = args => (
  <TitleContainer {...args} />
)

export const Base = Template.bind({})
Base.args = {
  title: 'Base Title Container',
  actions: () => [
    {
      value: 'New Action',
      onClick: () => {},
    },
  ],
  children: [<ActionButton onClick={() => {}} />],
}

export const WithReturnToTitle = Template.bind({})
WithReturnToTitle.args = {
  title: 'Base Title Container',
  returnTo: {
    title: 'ReturnTo Title',
  },
  actions: () => [
    {
      value: 'New Action',
      onClick: () => {},
    },
  ],
  children: [<ActionButton onClick={() => {}} />],
}

export const WithReturnToTitleAndLink = Template.bind({})
WithReturnToTitleAndLink.args = {
  title: 'Base Title Container',
  returnTo: {
    title: 'ReturnTo Title and Link',
    link: '/',
  },
  actions: () => [
    {
      value: 'New Action',
      onClick: () => {},
    },
  ],
  children: [<ActionButton onClick={() => {}} />],
}
