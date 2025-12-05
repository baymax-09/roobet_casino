import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { Skeleton } from './Skeleton'

type SkeletonType = typeof Skeleton

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  argTypes: {
    animation: { control: 'select', options: ['pulse', 'wave', false] },
    variant: { control: 'select', options: ['text', 'circle', 'rect'] },
  },
} as Meta<SkeletonType>

const Template: StoryFn<SkeletonType> = args => <Skeleton {...args} />

export const WaveAnimationSkeleton = Template.bind({})
WaveAnimationSkeleton.args = {
  variant: 'rect',
  animation: 'wave',
  width: 200,
  height: 200,
}

export const PulseAnimationSkeleton = Template.bind({})
PulseAnimationSkeleton.args = {
  variant: 'rect',
  animation: 'pulse',
  width: 200,
  height: 200,
}
