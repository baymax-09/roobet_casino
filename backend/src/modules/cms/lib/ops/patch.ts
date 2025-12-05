import { type Request } from 'express'

import { APIValidationError } from 'src/util/errors'

import { getCmsDocument, upsertCmsDocument } from '../../documents'
import { convertDocContent, parseReqBody } from '../docs'

export const patch = async (req: Request) => {
  const { name, lang } = req.params

  if (typeof lang !== 'string') {
    throw new APIValidationError('language must be a string')
  }

  const doc = await getCmsDocument(name, lang)

  if (!doc) {
    throw new APIValidationError('No such document.')
  }

  const incoming = parseReqBody(req.body)

  // Accept incoming changes, but rely on existing document.
  const content_html = convertDocContent(
    incoming.content ?? doc.content,
    incoming.format ?? doc.format,
  )

  const updated = await upsertCmsDocument({
    ...incoming,
    content_html,
    name,
    lang,
  })

  return updated
}
