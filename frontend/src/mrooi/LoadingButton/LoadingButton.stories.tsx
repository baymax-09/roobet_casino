import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { LoadingButton } from './LoadingButton'
import { useLoadingButtonStyles } from './LoadingButton.styles'

type LoadingButtonType = typeof LoadingButton

export default {
  title: 'Components/LoadingButton',
  component: LoadingButton,
  argTypes: {
    loading: { control: 'boolean', options: [true, false] },
    label: { control: 'text' },
  },
} as Meta<LoadingButtonType>

const Template: StoryFn<LoadingButtonType> = args => {
  const classes = useLoadingButtonStyles()
  return <LoadingButton className={classes.LoadingButton} {...args} />
}

export const Primary = Template.bind({})
Primary.args = {
  loading: true,
  label: 'Submit',
}
Primary.parameters = {
  backgrounds: { default: 'dark' },
}
