import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'
import { SnackbarProvider } from 'notistack'

import { ImagePreviewUpload } from './ImagePreviewUpload'

type ImagePreviewUploadType = typeof ImagePreviewUpload

export default {
  title: 'Components/ImagePreviewUpload',
  component: ImagePreviewUpload,
} as Meta<ImagePreviewUploadType>

const Template: StoryFn<ImagePreviewUploadType> = args => {
  const [src, setSrc] = React.useState('')

  const customUploadFile = async (_, file) => {
    return URL.createObjectURL(file)
  }

  return (
    <SnackbarProvider>
      <ImagePreviewUpload
        {...args}
        url={src}
        setUrl={value => setSrc(value)}
        customImageUpload={customUploadFile}
      />
    </SnackbarProvider>
  )
}

export const Default = Template.bind({})
Default.args = {}

Default.parameters = {
  theme: 'ACPLightMode',
}
