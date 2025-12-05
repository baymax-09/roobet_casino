import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Logo } from './Logo'
import { LogoWithClassName } from './Private'

type LogoType = typeof Logo
export default {
  title: 'Components/Logo',
  component: Logo,
} as Meta<LogoType>

const BaseTemplate: StoryFn<LogoType> = args => <Logo {...args} />
const ClassNameTemplate: StoryFn<typeof LogoWithClassName> = args => (
  <LogoWithClassName />
)

export const BaseLogo = BaseTemplate.bind({})
export const ClassNameLogo = ClassNameTemplate.bind({})
