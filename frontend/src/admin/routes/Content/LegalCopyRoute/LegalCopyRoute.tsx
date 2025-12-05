import React from 'react'
import { Formik, Form } from 'formik'
import { TextField, Typography, Button } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'

import { withRulesAccessController } from 'admin/components'
import { useCmsContent, useAccessControl } from 'admin/hooks'
import { ManagedLegalContent } from 'common/constants'
import { localizations } from 'app/constants'

import { useLegalCopyRouteStyles } from './LegalCopyRoute.styles'

interface LegalCopyFormProps {
  docKey: string
  langKey: string
}

const ReadAccessForm = withRulesAccessController(['legal:read'], Formik)
const UpdateAccessButton = withRulesAccessController(['legal:update'], Button)

// TODO move me to my own file
const LegalCopyForm: React.FC<LegalCopyFormProps> = ({ docKey, langKey }) => {
  const classes = useLegalCopyRouteStyles()
  const current = ManagedLegalContent[docKey]
  const currentLanguage = langKey
  const [doc, updateDoc] = useCmsContent(current.name, currentLanguage)
  const { hasAccess: hasLegalContentAccess } = useAccessControl(['legal:read'])

  const onSubmit = async values => {
    await updateDoc(values)
  }

  if (!hasLegalContentAccess) {
    return null
  }

  return (
    <ReadAccessForm
      enableReinitialize
      initialValues={{
        lang: currentLanguage,
        name: current.name,
        title: doc.title || '',
        format: doc.format || 'text',
        content: doc.content || '',
      }}
      onSubmit={onSubmit}
    >
      {({ values, handleChange }) => (
        <Form className={classes.docForm}>
          <TextField
            variant="standard"
            required
            className={classes.input}
            name="title"
            label="Title"
            value={values.title}
            onChange={handleChange}
          />
          <TextField
            variant="standard"
            select
            required
            className={classes.input}
            value={values.format}
            name="format"
            label="Format"
            size="small"
            onChange={handleChange}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="markdown">Markdown (renders as HTML)</MenuItem>
          </TextField>
          <TextField
            variant="standard"
            required
            fullWidth
            multiline
            rows={15}
            name="content"
            label="Content"
            value={values.content}
            onChange={handleChange}
          />
          <UpdateAccessButton
            color="primary"
            type="submit"
            className={classes.save}
            variant="contained"
            size="medium"
            onClick={() => undefined}
          >
            Save
          </UpdateAccessButton>
        </Form>
      )}
    </ReadAccessForm>
  )
}

export const LegalCopyRoute: React.FC = () => {
  const classes = useLegalCopyRouteStyles()
  const [state, setState] = React.useState({
    currentDoc: Object.keys(ManagedLegalContent)[0],
    currentLanguage: 'en',
  })

  const handleSelect = event => {
    setState(prev => ({ ...prev, currentDoc: event.target.value }))
  }

  const handleLang = event => {
    setState(prev => ({ ...prev, currentLanguage: event.target.value }))
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h2" className={classes.title}>
          Legal Copy
        </Typography>
        <div>
          <TextField
            select
            value={state.currentDoc}
            variant="outlined"
            label="Document"
            size="small"
            onChange={handleSelect}
          >
            {Object.entries(ManagedLegalContent).map(([key, { admin }]) => (
              <MenuItem key={key} value={key}>
                {admin.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            value={state.currentLanguage}
            variant="outlined"
            label="Language"
            size="small"
            className={classes.domain}
            onChange={handleLang}
          >
            {localizations.map(language => (
              <MenuItem key={language.code} value={language.code}>
                {language.lang}
              </MenuItem>
            ))}
          </TextField>
        </div>
      </div>

      <div>
        <LegalCopyForm
          docKey={state.currentDoc}
          langKey={state.currentLanguage}
        />
      </div>
    </div>
  )
}
