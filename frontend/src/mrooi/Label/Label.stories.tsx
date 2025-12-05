import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Label } from './Label'

type LabelType = typeof Label

export default {
  title: 'Components/Label',
  component: Label,
  argTypes: {
    children: { control: 'text', defaultValue: 'Label' },
  },
} as Meta<LabelType>

const Template: StoryFn<LabelType> = args => <Label {...args} />

export const dialog = Template.bind({})
dialog.args = {}
