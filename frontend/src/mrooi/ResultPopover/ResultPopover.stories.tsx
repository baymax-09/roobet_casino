import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { ResultPopover } from './ResultPopover'
import { ResultPopoverVariant } from './Private'

export default {
  title: 'Components/ResultPopover',
  component: ResultPopover,
} as Meta<typeof ResultPopover>

const PopoverTemplate: StoryFn<typeof ResultPopoverVariant> = args => (
  <ResultPopoverVariant {...args} />
)

export const Successful = PopoverTemplate.bind({})
Successful.args = {
  error: false,
}
export const Error = PopoverTemplate.bind({})
Error.args = {
  error: true,
}
