import React from 'react'
import { FormGroup, TextField } from '@mui/material'
import { useFormik } from 'formik'

import {
  ImagePreviewUpload,
  TitleContainer,
  useTitleContainerStyles,
} from 'mrooi'
import { useToasts } from 'common/hooks'

import { useMessateTemplateFormStyles } from './MessageTemplateForm.styles'

interface MessageTemplateFormProps {
  title: string
  initialValues: Record<string, any>
  onSubmit: (values: Record<string, any>) => void
}

export const MessageTemplateForm: React.FC<MessageTemplateFormProps> = ({
  title,
  initialValues,
  onSubmit,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null)
  const { toast } = useToasts()

  const classes = {
    ...useMessateTemplateFormStyles(),
    ...useTitleContainerStyles(),
  }

  const validateAndSubmit = () => {
    // Check that form is valid.
    if (formRef.current) {
      const isValid = formRef.current.checkValidity()

      if (!isValid) {
        formRef.current.reportValidity()
        return
      }
    }

    if (!formik.values.heroImage) {
      toast.warn('Please upload a hero image file.')
      return
    }

    onSubmit(formik.values)
  }

  const formik = useFormik({
    initialValues,
    onSubmit: validateAndSubmit,
  })

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'Message Templates',
        link: '/messaging/templates',
      }}
      actions={() => [
        {
          value: 'Save',
          onClick: validateAndSubmit,
        },
      ]}
    >
      <form
        className={classes.formContainer}
        onSubmit={formik.handleSubmit}
        ref={formRef}
      >
        <FormGroup>
          <TextField
            variant="standard"
            required
            id="name"
            label="Name"
            type="text"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
          />
        </FormGroup>
        <div className={classes.heroImageUpload}>
          <ImagePreviewUpload
            id="squareImage"
            identifier="message-template-hero"
            url={formik.values.heroImage}
            setUrl={url =>
              formik.setValues(values => ({ ...values, heroImage: url }))
            }
          />
        </div>
        <FormGroup>
          <TextField
            variant="standard"
            required
            id="title"
            label="Title"
            type="text"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
          />
        </FormGroup>
        <FormGroup>
          <TextField
            variant="standard"
            required
            id="body"
            label="Tagline"
            type="text"
            name="body"
            value={formik.values.body}
            onChange={formik.handleChange}
          />
        </FormGroup>
        {/* submit button to support keyboard interactions */}
        <input type="submit" style={{ display: 'none' }} />
      </form>
    </TitleContainer>
  )
}
