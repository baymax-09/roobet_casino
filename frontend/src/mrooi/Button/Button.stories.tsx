import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { playSound } from 'app/lib/sound'

import { Button } from './Button'
import { AllButtonTypes } from './Private'

type ButtonType = typeof Button

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    type: {
      control: 'select',
      options: [
        'white',
        'yellow',
        'green',
        'red',
        'lightPurple',
        'darkPurple',
        'modifierButton',
        'gameSetting',
        'lightSuffix',
        'light',
        'transparent',
      ],
    },
  },
} as Meta<ButtonType>

const Template: StoryFn<ButtonType> = args => <Button {...args} />
const AllButtonTypesTemplate: StoryFn<ButtonType> = args => (
  <AllButtonTypes {...args} />
)

export const ButtonTypes = AllButtonTypesTemplate.bind({})

export const LinkButton = Template.bind({})
LinkButton.args = {
  type: 'lightPurple',
  to: 'testTo',
  children: 'Link',
}

export const ButtonWithOnCLick = Template.bind({})
ButtonWithOnCLick.args = {
  type: 'modifierButton',
  onClick: () => {
    playSound('bet', 'modify')
  },
  children: 'On Click Button',
}

export const OutlineButton = Template.bind({})
OutlineButton.args = {
  type: 'red',
  outline: true,
  children: 'Outline Button',
}
