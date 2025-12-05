import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Link } from './Link'

type LinkType = typeof Link

export default {
  title: 'Components/Link',
  component: Link,
} as Meta<LinkType>

const Template: StoryFn<LinkType> = args => <Link {...args} />

export const ExternalURLLink = Template.bind({})
ExternalURLLink.args = {
  urlOrPath: 'https://roobet.com',
  children: 'External URL Link',
}

export const InternalURLLink = Template.bind({})
InternalURLLink.args = {
  urlOrPath: '?path=/story',
  children: 'Internal URL Link',
}

export const ParentTargetLink = Template.bind({})
ParentTargetLink.args = {
  urlOrPath: '?path=/story',
  children: 'Parent Target Link',
  target: '_parent',
}
