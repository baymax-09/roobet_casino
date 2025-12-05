import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Loading } from './Loading'

type LoadingType = typeof Loading

export default {
  title: 'Components/Loading',
  component: Loading,
  argTypes: {},
} as Meta<LoadingType>

const Template: StoryFn<LoadingType> = args => <Loading {...args} />

export const Primary = Template.bind({})
Primary.args = {}
Primary.parameters = {
  backgrounds: { default: 'dark' },
}
