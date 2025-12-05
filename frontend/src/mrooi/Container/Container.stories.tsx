import React from 'react'
import { Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { type StoryFn, type Meta } from '@storybook/react'

import { Container } from './Container'
import { ContainerWithClassname } from './Private'

type ContainerType = typeof Container

export default {
  title: 'Components/Container',
  component: Container,
} as Meta<ContainerType>

const ContainerTemplate: StoryFn<ContainerType> = args => (
  <Container {...args} />
)
const ContainerWithClassNameTemplate: StoryFn<ContainerType> = () => (
  <ContainerWithClassname />
)

export const BaseContainer = ContainerTemplate.bind({})
BaseContainer.args = {
  children: [
    <Typography variant="h1" color="primary">
      <Trans i18nKey="storybook.containerText"></Trans>
    </Typography>,
  ],
}

export const ContainerWithClassName = ContainerWithClassNameTemplate.bind({})
