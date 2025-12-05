import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { FileUpload } from './FileUpload'

type FileUploadType = typeof FileUpload

export default {
  title: 'Components/FileUpload',
  component: FileUpload,
} as Meta<FileUploadType>

const Template: StoryFn<FileUploadType> = args => <FileUpload {...args} />

export const BasicDropzone = Template.bind({})

export const SubmitButtonWithDropzone = Template.bind({})
SubmitButtonWithDropzone.args = {
  submitButtonText: 'Submit',
  dropzoneText: 'Drag and drop file here or click',
  acceptedFiles: ['image/png', 'image/jpg', '.pdf'],
}

export const DisabledDropzone = Template.bind({})
DisabledDropzone.args = {
  submitButtonText: 'Submit',
  dropzoneText: 'Drag and drop file here or click',
  disabled: true,
}
