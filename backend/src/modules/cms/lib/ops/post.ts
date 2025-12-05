import { type Request } from 'express'

import { APIValidationError } from 'src/util/errors'

import { CMSContentFormats, upsertCmsDocument } from '../../documents'
import { convertDocContent, parseReqBody } from '../docs'

export const post = async (req: Request) => {
  /*
   * TS: Destructure name until we upgrade to v4.5
   * @see https://github.com/microsoft/TypeScript/pull/46266
   */
  const { name, lang, ...incoming } = parseReqBody(req.body)

  if (typeof lang !== 'string') {
    throw new APIValidationError('language must be a string')
  }

  if (!name) {
    throw new APIValidationError('cms__name_required')
  }

  if (!incoming.title) {
    throw new APIValidationError('cms__title_required')
  }

  if (!incoming.content) {
    throw new APIValidationError('cms__content_required')
  }

  if (
    incoming.format &&
    !Object.values(CMSContentFormats).includes(incoming.format)
  ) {
    throw new APIValidationError('cms__format_invalid')
  }

  // Convert content, use text as default format.
  const content_html = convertDocContent(
    incoming.content,
    incoming.format ?? CMSContentFormats.TEXT,
  )

  // Write incoming.
  const writeResult = await upsertCmsDocument({
    ...incoming,
    content_html,
    name,
    lang,
  })

  if (!writeResult) {
    throw new Error('Failed to upsert CMSContent document.')
  }

  return writeResult
}
