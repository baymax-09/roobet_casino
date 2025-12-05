import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import Balance from './Balance'

type BalanceType = typeof Balance

export default {
  title: 'Components/Balance',
  component: Balance,
} as Meta<BalanceType>

const Template: StoryFn<BalanceType> = args => <Balance {...args} />

export const BalanceLight = Template.bind({})
BalanceLight.args = {
  dark: false,
}

export const BalanceLightWithDeposit = Template.bind({})
BalanceLightWithDeposit.args = {
  showDeposit: true,
  dark: false,
}

export const BalanceDark = Template.bind({})
BalanceDark.args = {
  dark: true,
}

export const BalanceWithDeposit = Template.bind({})
BalanceWithDeposit.args = {
  showDeposit: true,
  dark: true,
}
