import { marked } from 'marked'
import { type Request } from 'express'

import { APIValidationError } from 'src/util/errors'

import { type CMSContentDocument } from '../documents'
import { CMSContentFormats } from '../documents'

/**
 * Accepts a request body, returning only valid CMSContent fields.
 */
export const parseReqBody = (
  body: Request['body'],
): Partial<CMSContentDocument> => {
  return {
    lang: body?.lang,
    name: body?.name,
    title: body?.title,
    content: body?.content,
    format: body?.format,
  }
}

export const convertDocContent = (
  content: string,
  format: CMSContentFormats,
): string => {
  if (format === CMSContentFormats.MARKDOWN) {
    try {
      const html = marked(content, {
        headerIds: false,
        silent: true,
        sanitize: true,
      })

      // Remove new line characters.
      return html.replace(/(\r\n|\n|\r)/gm, '')
    } catch {
      throw new APIValidationError(
        'Failed to convert markdown to html. Did you provide valid markdown?',
      )
    }
  }

  // Else, return passed content unchanged.
  return content
}
