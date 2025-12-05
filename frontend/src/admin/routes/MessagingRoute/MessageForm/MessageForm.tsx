import React from 'react'
import {
  FormGroup,
  TextField,
  FormControlLabel,
  Paper,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Button,
  Switch,
} from '@mui/material'
import { useFormik } from 'formik'
import Typography from '@mui/material/Typography'
import { useToggle } from 'react-use'
import { useQuery } from '@apollo/client'

import {
  TitleContainer,
  useTitleContainerStyles,
  ImagePreviewUpload,
  DataTable,
} from 'mrooi'
import { MessageTemplatesQuery } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { BulkRecipientUploadButton } from './BulkRecipientUploadButton'

import { useMessageFormStyles } from './MessageForm.styles'

const CLEAR_TEMPLATE_VAL = '__clear'

interface MessageFormProps {
  title: string
  initialValues: Record<string, any>
  onSubmit: (values: Record<string, any>, send: boolean) => void
}

export const MessageForm: React.FC<MessageFormProps> = ({
  title,
  initialValues,
  onSubmit,
}) => {
  const { toast } = useToasts()
  const formRef = React.useRef<HTMLFormElement | null>(null)

  const classes = {
    ...useMessageFormStyles(),
    ...useTitleContainerStyles(),
  }

  const [recipientField, setRecipientField] = React.useState('')
  const [templateField, setTemplateField] = React.useState('')

  const [all, toggleAll] = useToggle(initialValues.recipients?.length === 0)

  const { data: { messageTemplates } = {} } = useQuery(MessageTemplatesQuery)

  const addRecipient = recipient => {
    if (recipient) {
      formik.setValues(values => ({
        ...values,
        recipients: [...(values.recipients ?? []), recipient],
      }))
    }

    setRecipientField('')
  }

  const addRecipients = recipients => {
    formik.setValues(values => ({
      ...values,
      recipients: [...(values.recipients ?? []), ...recipients],
    }))
  }

  const removeRecipient = recipient => {
    formik.setValues(values => {
      const newValue = [...(values.recipients ?? [])]

      const index = newValue.indexOf(recipient)
      newValue.splice(index, 1)

      return {
        ...values,
        recipients: newValue,
      }
    })
  }

  const handleTemplateChange = React.useCallback(event => {
    const { value } = event.target

    const proceed = window.confirm(
      'Are you sure you want to change the template? You will lose all changes.',
    )

    if (proceed) {
      setTemplateField(value)
    }
  }, [])

  const baseRecipientsColumns = [
    {
      name: 'recipients',
      label: 'Recipient',
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        customBodyRender: (_, { rowData }) => {
          return (
            <div>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={removeRecipient.bind(null, rowData[0])}
              >
                Remove
              </Button>
            </div>
          )
        },
      },
    },
  ]

  const validateAndSubmit = send => () => {
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

    if (!all && !formik.values.recipients?.length) {
      toast.warn('Please specify recipients.')
      return
    }

    const values = {
      ...formik.values,
      recipients: all ? [] : formik.values.recipients,
    }

    onSubmit(values, send)
  }

  const formik = useFormik({
    onSubmit: validateAndSubmit(false),
    initialValues: {
      id: initialValues.id ?? undefined,
      title: initialValues.title ?? '',
      body: initialValues.body ?? '',
      heroImage: initialValues.heroImage ?? '',
      link: initialValues.link ?? '',
      recipients: initialValues.recipients ?? null,
    },
  })

  // Pull out resetForm so the useEffect deps are correct.
  const { setValues } = formik

  React.useEffect(() => {
    if (!templateField) {
      return
    }

    if (templateField === CLEAR_TEMPLATE_VAL) {
      setValues(prevValues => ({
        ...prevValues,
        title: '',
        body: '',
        heroImage: '',
      }))

      setTemplateField('')
      return
    }

    const template = messageTemplates.find(({ id }) => id === templateField)

    if (template) {
      setValues(prevValues => ({
        ...prevValues,
        title: template.title,
        body: template.body,
        heroImage: template.heroImage,
      }))
    }
  }, [templateField, messageTemplates, setValues])

  const tableRecipients = (formik.values.recipients ?? []).map(recipients => ({
    recipients,
  }))

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'Messages',
        link: '/messaging/mailbox',
      }}
      actions={() => [
        {
          value: 'Save Draft',
          variant: 'outlined',
          onClick: validateAndSubmit(false),
        },
        {
          value: 'Preview Message',
          onClick: validateAndSubmit(true),
        },
      ]}
    >
      <form
        className={classes.formContainer}
        onSubmit={formik.handleSubmit}
        ref={formRef}
      >
        <FormGroup>
          <InputLabel id="message-template-label">Template</InputLabel>
          <Select
            variant="standard"
            labelId="message-template-label"
            id="message-template"
            value={templateField}
            label="Age"
            displayEmpty
            onChange={handleTemplateChange}
          >
            {templateField ? (
              <MenuItem value={CLEAR_TEMPLATE_VAL}>Clear template...</MenuItem>
            ) : (
              <MenuItem value="" disabled>
                Select template...
              </MenuItem>
            )}
            {(messageTemplates ?? []).map(template => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormGroup>
        <Divider />
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
            InputLabelProps={{ shrink: formik.values.title }}
          />
        </FormGroup>
        <FormGroup>
          <TextField
            variant="standard"
            required
            id="body"
            label="Body"
            type="text"
            name="body"
            value={formik.values.body}
            onChange={formik.handleChange}
            InputLabelProps={{ shrink: formik.values.body }}
          />
        </FormGroup>

        <div className={classes.imageUpload}>
          <ImagePreviewUpload
            title="Hero Image"
            helpText="Please choose an image that is at least 330x120px in size, and has a 11:4 ratio."
            id="squareImage"
            identifier="message-template-hero"
            url={formik.values.heroImage}
            setUrl={url =>
              formik.setValues(values => ({ ...values, heroImage: url }))
            }
            previewClassName={classes.imageUploadPreview}
          />
        </div>

        {/* These two fields are not being currently used. */}

        {/* <div className={classes.imageUpload}>
          <ImagePreviewUpload
            title="Featured Image"
            id="squareImage"
            identifier="message-template-featured"
            url={formik.values.featuredImage}
            setUrl={url => formik.setValues(values => ({ ...values, featuredImage: url }))}
          />
        </div> */}

        {/* <div className={classes.imageUpload}>
          <ImagePreviewUpload
            title="Logo Image"
            id="squareImage"
            identifier="message-template-logo"
            url={formik.values.logoImage}
            setUrl={url => formik.setValues(values => ({ ...values, logoImage: url }))}
          />
        </div> */}

        <FormGroup>
          <TextField
            variant="standard"
            id="link"
            label="Link"
            type="text"
            name="link"
            value={formik.values.link}
            onChange={formik.handleChange}
            InputLabelProps={{ shrink: formik.values.link }}
          />
        </FormGroup>
        <FormGroup>
          <Typography variant="h6">Recipients</Typography>
          <FormControlLabel
            control={
              <Switch color="secondary" checked={all} onChange={toggleAll} />
            }
            label="All Users"
            labelPlacement="end"
          />
          {!all ? (
            <div className={classes.root}>
              <div>
                <Paper elevation={0} className={classes.recipientsContainer}>
                  <Typography variant="h6">Add Recipient</Typography>
                  <div className={classes.recipientsField}>
                    <TextField
                      variant="standard"
                      id="user"
                      label="Username or ID"
                      name="user"
                      type="text"
                      value={recipientField}
                      onChange={({ target }) => setRecipientField(target.value)}
                    />
                    <Button
                      onClick={() => addRecipient(recipientField)}
                      variant="contained"
                      color="primary"
                      size="small"
                    >
                      Add
                    </Button>
                    <div className={classes.bulkUserButton}>
                      <BulkRecipientUploadButton
                        addRecipients={addRecipients}
                      />
                    </div>
                  </div>
                </Paper>

                <DataTable
                  hideToolbar
                  options={{ rowsPerPage: 5, sort: false, filter: false }}
                  columns={baseRecipientsColumns}
                  data={tableRecipients}
                />
              </div>
            </div>
          ) : null}
        </FormGroup>
      </form>
    </TitleContainer>
  )
}
