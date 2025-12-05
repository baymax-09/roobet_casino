import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { PrivateMultiSelect } from './Private'

type PrivateMultiSelectType = typeof PrivateMultiSelect

export default {
  title: 'Components/MultiSelect',
  component: PrivateMultiSelect,
} as Meta<PrivateMultiSelectType>

const Template: StoryFn<PrivateMultiSelectType> = () => <PrivateMultiSelect />

export const Base = Template.bind({})
